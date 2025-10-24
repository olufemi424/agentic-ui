import React from "react";
import InvestmentActionCard from "../InvestmentActionCard";

export const ProposedActionPart = React.memo(
  ({
    action,
    payload,
    onResult,
  }: {
    action: string;
    payload: any;
    onResult?: (res: any) => void;
  }) => {
    return (
      <div className="max-w-[80%] mx-auto chat__tool-card chat__tool-card--proposed">
        <InvestmentActionCard
          action={
            action as
              | "createInvestmentAccount"
              | "updateInvestmentAccount"
              | "deleteInvestmentAccount"
          }
          payload={payload}
          onResult={
            onResult ??
            (() => {
              return;
            })
          }
          onCancel={() => {}}
        />
      </div>
    );
  }
);

ProposedActionPart.displayName = "ProposedActionPart";
