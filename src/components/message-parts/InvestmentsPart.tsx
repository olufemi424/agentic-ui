import React from "react";
import InvestmentAccountCard from "../InvestmentAccountCard";

interface InvestmentAccount {
  id: string;
  name: string;
  institution: string;
  accountType: string;
  balance: number;
  holdings?: Array<{ symbol: string; quantity: number; avgPrice: number }>;
}

export const InvestmentsPart = React.memo(
  ({ accounts }: { accounts: InvestmentAccount[] }) => {
    return (
      <div className="max-w-[80%] mx-auto chat__tool-card chat__tool-card--investments">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accounts.map((acc, i) => (
            <InvestmentAccountCard key={acc.id || i} account={acc} />
          ))}
        </div>
      </div>
    );
  }
);

InvestmentsPart.displayName = "InvestmentsPart";
