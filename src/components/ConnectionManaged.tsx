import { useEntry } from "@frc-web-components/react";
import { useEffect, useState } from "react";
import DisconnectedNotice from "./DisconnectedFromServerNotice";

function ConnectionManaged({ children }: { children: React.ReactNode }) {
    const [robotConnected, setRobotConnected] = useState(false);
    const [connected] = useEntry(`/FWC/connected`, false);
    const [heartbeat] = useEntry(`/FWC/heartbeat`, 0);
    
    useEffect(() => {
      const checkConnection = () => {
        const isConnected = connected && heartbeat > Date.now() - 5000; // 5 seconds threshold
        setRobotConnected(isConnected);
      };
    
      checkConnection(); // Initial check
      const intervalId = setInterval(checkConnection, 1000); // Check every second
    
      return () => clearInterval(intervalId); // Cleanup on unmount
    }, [connected, heartbeat]);
    return (
        <>
            {children}
            <DisconnectedNotice isDisconnected={!robotConnected} />
        </>
    )
}

export default ConnectionManaged;