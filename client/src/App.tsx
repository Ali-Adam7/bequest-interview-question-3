import React, { useEffect, useState } from "react";
import { arrayBufferToBase64, generateKeys, hashData, signData, verifySignature } from "./cryptoHelpers.ts";

const API_URL = "http://localhost:8080";
interface Backup {
  data: string;
  timestamp: Date;
}
function App() {
  const [keys, setKeys] = useState<CryptoKeyPair>();
  const [data, setData] = useState<string>();
  const [backup, setBackup] = useState<Backup[]>([]);
  const [isTampered, setIsTampered] = useState<boolean>(false);

  async function getKeys() {
    const keys = await generateKeys();
    setKeys(keys);
  }
  useEffect(() => {
    getKeys();
    getData();
  }, []);

  const getData = async () => {
    const response = await fetch(API_URL);
    const { data, signature } = await response.json();
    setData(data);
    return signature;
  };

  const addToBackup = () => {
    if (!data) return;
    const entry: Backup = { data, timestamp: new Date() };
    setBackup((prev) => [...prev, entry]);
  };

  const clearBackup = () => setBackup([]);

  const updateData = async () => {
    if (!data || !keys) return;
    addToBackup();
    const hash = await hashData(data);
    const signature = await signData(hash, keys.privateKey);
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ data, signature: arrayBufferToBase64(signature) }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    await getData();
  };

  const verifyData = async () => {
    try {
      if (!data || !keys) return;
      const signature = await getData();
      const serverHash = await hashData(data);
      const isVerified = await verifySignature(signature, serverHash, keys?.publicKey);
      if (!isVerified) {
        alert("Data is tampered");
        setIsTampered(true);
        return;
      }
      alert("Data verified");
      clearBackup();
      return setIsTampered(false);
    } catch (e) {
      console.log(e);
      alert("Data could be tampered with");
      setIsTampered(true);
      return;
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        position: "absolute",
        padding: 0,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "20px",
        fontSize: "30px",
      }}
    >
      <div>Saved Data</div>
      <input style={{ fontSize: "30px" }} type="text" value={data} onChange={(e) => setData(e.target.value)} />

      <div style={{ display: "flex", gap: "10px" }}>
        <button style={{ fontSize: "20px" }} onClick={updateData}>
          Update Data
        </button>
        <button style={{ fontSize: "20px" }} onClick={verifyData}>
          Verify Data
        </button>
      </div>

      {isTampered && (
        <div>
          <p>Recovered Data that are possibly tampered (Not Verified)</p>
          {backup.map((entry, index) => {
            return (
              <p key={index}>
                {entry.data} at {entry.timestamp.toISOString()}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
