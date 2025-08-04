// import React, { useEffect, useState } from 'react';
// import { Bell } from 'lucide-react';

// const AlertBell = ({ aqi }) => {
//   const isAlert = aqi != null && aqi > 110;
//   const [lastAlertState, setLastAlertState] = useState(null);

//   useEffect(() => {
//     if (lastAlertState === null) {
//       setLastAlertState(isAlert);
//       return;
//     }
//     if (isAlert !== lastAlertState) {
//       if (isAlert) {
//         alert(Warning: AQI is now ${aqi} — above 110.);
//       } else {
//         alert(AQI dropped to ${aqi} — back to safe levels.);
//       }
//       setLastAlertState(isAlert);
//     }
//   }, [isAlert, aqi, lastAlertState]);

//   const handleClick = () => {
//     if (isAlert) {
//       alert(Warning: AQI is currently ${aqi} — above safe levels.);
//     } else {
//       alert(AQI is currently ${aqi} — air quality is normal.);
//     }
//   };

//   return (
//     <button
//       aria-label={isAlert ? 'Air quality alert' : 'Air quality normal'}
//       type="button"
//       onClick={handleClick}
//       className={`relative p-3 rounded-full border shadow-lg transition-transform duration-300
//         focus:outline-none focus:ring-4 focus:ring-offset-2 ${
//           isAlert
//             ? 'bg-red-600 border-red-800 text-white hover:bg-red-700 hover:scale-110 animate-pulse-glow'
//             : 'bg-green-600 border-green-800 text-white hover:bg-green-700'
//         }`}
//       title={isAlert ? AQI ${aqi} - Alert : AQI ${aqi} - Normal}
//     >
//       <Bell
//         className={`w-7 h-7 transition-transform ${
//           isAlert ? 'animate-scale-pulse' : ''
//         }`}
//       />
//       <span
//         className={`absolute top-1.5 right-1.5 h-3 w-3 rounded-full border-2 border-white
//           ${isAlert ? 'bg-red-900 animate-blink-ring' : 'bg-green-900 animate-blink-ring-slow'}`}
//       />
//       <style>{`
//         @keyframes pulse-glow {
//           0% { box-shadow: 0 0 8px 2px rgba(220, 38, 38, 0.8); }
//           50% { box-shadow: 0 0 20px 6px rgba(220, 38, 38, 1); }
//           100% { box-shadow: 0 0 8px 2px rgba(220, 38, 38, 0.8); }
//         }
//         @keyframes scale-pulse {
//           0%, 100% { transform: scale(1); }
//           50% { transform: scale(1.15); }
//         }
//         @keyframes blink-ring {
//           0% {
//             box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
//             opacity: 1;
//           }
//           70% {
//             box-shadow: 0 0 0 6px rgba(220, 38, 38, 0);
//             opacity: 0;
//           }
//           100% {
//             opacity: 0;
//           }
//         }
//         @keyframes blink-ring-slow {
//           0% {
//             box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
//             opacity: 1;
//           }
//           70% {
//             box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
//             opacity: 0;
//           }
//           100% {
//             opacity: 0;
//           }
//         }
//         .animate-pulse-glow {
//           animation: pulse-glow 2.5s ease-in-out infinite;
//         }
//         .animate-scale-pulse {
//           animation: scale-pulse 2s ease-in-out infinite;
//         }
//         .animate-blink-ring {
//           animation: blink-ring 2s ease-out infinite;
//         }
//         .animate-blink-ring-slow {
//           animation: blink-ring-slow 3.5s ease-out infinite;
//         }
//       `}</style>
//     </button>
//   );
// };

// export default AlertBell;