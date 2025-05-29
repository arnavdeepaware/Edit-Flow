import React from "react";
import { useUser } from "../context/UserContext";

function TokensPage() {
  const { user, handleTokenChange } = useUser();

  const exchangeRate = 0.01;
  const options = [100, 500, 1000, 5000, 10000];

  if (!user) return <div>Please sign in to purchase tokens.</div>;

  return (
    <div className="tokens-page">
      <main className="panel">
        <h1 className="title">Buy Tokens</h1>
        <table className="tokens-table">
          <thead>
            <tr>
              <th>Price</th>
              <th>Tokens</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option}>
                <td>${option * exchangeRate}</td>
                <td>
                  <button onClick={() => handleTokenChange(option)}>
                    🪙{option}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default TokensPage;
