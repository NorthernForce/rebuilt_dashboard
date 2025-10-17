import { useEntry } from "@frc-web-components/react";
import { useState } from "react";
import styles from './Ralph.module.css';
import ReefscapeDisplay from "./ReefscapeDisplay";

interface MultiCameraFeedProps {
    srcs: string[];
}

function MultiCameraFeed({ srcs }: MultiCameraFeedProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [attemptedAll, setAttemptedAll] = useState(false);
    const [_failedSources, setFailedSources] = useState(new Set<number>());

    const handleError = () => {
        setFailedSources(prev => {
            const newFailedSources = new Set(prev);
            newFailedSources.add(currentIndex);
            
            // If we've failed all sources, mark as attempted all
            if (newFailedSources.size === srcs.length) {
                setAttemptedAll(true);
                return newFailedSources;
            }
            
            return newFailedSources;
        });
        
        setCurrentIndex((prevIndex) => (prevIndex + 1) % srcs.length);
    };

    // If we've attempted all sources and they all failed, show backup text
    if (attemptedAll || srcs.length === 0) {
        return (
            <>
                <div className={styles.feedUnavailable}>Camera Feed Unavailable</div>
            </>
        );
    }

    return (
        <img
            key={srcs[currentIndex]}
            src={srcs[currentIndex]}
            alt="FRC Camera Feed"
            onError={handleError}
        />
    );
}


function Ralph()
{
    const cameraSourceKey = '/FWC/Camera';
    const [srcs] = useEntry(cameraSourceKey, []);
    return (
        <div className={styles.body}>
            <div className={styles.main}>
                <div className={styles.camera}>
                    <MultiCameraFeed srcs={srcs} />
                </div>
            </div>
            <div className={styles.sidebar} >
                <ReefscapeDisplay />
            </div>
        </div>
    );
}

export default Ralph;