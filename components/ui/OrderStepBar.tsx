import React from "react";

const DEFAULT_STEPS = [
  { label: "Inquiry", key: "inquiry" },
  { label: "Review", key: "review" },
  { label: "Confirm & Pay", key: "confirm_pay" },
  { label: "Scheduling", key: "scheduling" },
  { label: "Production", key: "production" },
  { label: "Shipping", key: "shipping" },
  { label: "Receiving", key: "receiving" },
  { label: "Complete", key: "complete" },
];

export default function OrderStepBar({
  currentStatus,
  steps = DEFAULT_STEPS,
}: {
  currentStatus: string;
  steps?: { label: string; key: string }[];
}) {
  const currentStep = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex items-center justify-center mt-2 mb-2 px-1 sm:px-2 bg-white/80 rounded-xl shadow-sm overflow-x-auto">
      <div className="flex items-center gap-0 min-w-0">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={["flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 shadow-sm transition-all duration-200",
                    isDone
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-md"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  ].join(" ")}
                  style={{ fontWeight: 700, fontSize: 12 }}
                >
                  {isDone ? (
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div
                  className={["mt-1 sm:mt-2 text-xs sm:text-sm font-semibold text-center break-words select-none transition-all duration-200 tracking-wide",
                    isDone
                      ? "text-green-600"
                      : isActive
                      ? "text-blue-700"
                      : "text-gray-400"
                  ].join(" ")}
                  style={{ minWidth: 40, maxWidth: 60 }}
                >
                  {step.label}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex items-center mx-1 sm:mx-2">
                  <svg width="14" height="6" className="sm:w-[22px] sm:h-[12px]" viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 6H20M20 6L17 3M20 6L17 9" stroke={isDone || isActive ? '#2563eb' : '#d1d5db'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
} 