"use client";

import { useState } from "react";

export type PendingApproval = {
  id: string;
  value: {
    actionRequests: Array<{
      name: string;
      args: Record<string, string | number | boolean>;
      description: string;
    }>;
    reviewConfigs: Array<{
      actionName: string;
      allowedDecisions: string[];
    }>;
  };
};

type ApprovalCardProps = {
  pendingApproval: PendingApproval;
  onApproval: (
    decision: "approve" | "reject" | "edit",
    editedArgs?: { name: string; args: Record<string, string | number | boolean> }
  ) => void;
  loading: boolean;
};

export default function ApprovalCard({
  pendingApproval,
  onApproval,
  loading,
}: ApprovalCardProps) {
  const action = pendingApproval.value.actionRequests[0];
  const config = pendingApproval.value.reviewConfigs[0];

  const canEdit = config.allowedDecisions.includes("edit");

  const [editing, setEditing] = useState(false);
  const [editedArgs, setEditedArgs] = useState(action.args);

  const handleChange = (key: string, value: string) => {
    setEditedArgs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="flex justify-start">
      <div className="bg-yellow-50 border border-yellow-200 px-4 py-4 rounded-2xl rounded-tl-none max-w-[85%] md:max-w-[75%]">
        <p className="text-sm font-medium text-yellow-800 mb-2">
          Action requires approval:
        </p>

        <div className="bg-white p-3 rounded-lg border border-yellow-100 mb-3">
          <p className="text-xs font-mono text-slate-600 mb-2">
            {action.name}
          </p>

          {editing ? (
            <div className="space-y-2">
              {Object.entries(editedArgs).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">
                    {key}
                  </label>

                  {key === "body" ? (
                    <textarea
                      value={String(value)}
                      onChange={(e) =>
                        handleChange(key, e.target.value)
                      }
                      className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={4}
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) =>
                        handleChange(key, e.target.value)
                      }
                      className="px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <pre className="text-xs text-slate-500 whitespace-pre-wrap">
              {JSON.stringify(action.args, null, 2)}
            </pre>
          )}
        </div>

        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => onApproval("approve")}
                disabled={loading}
                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>

              <button
                onClick={() => onApproval("reject")}
                disabled={loading}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>

              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Edit
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onApproval("edit", { name: action.name, args: editedArgs })}
                disabled={loading}
                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Save
              </button>

              <button
                onClick={() => {
                  setEditedArgs(action.args);
                  setEditing(false);
                }}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-600 text-white text-xs rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}