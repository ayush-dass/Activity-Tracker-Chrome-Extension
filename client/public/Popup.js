import React, { useState, useEffect } from 'react';
import chrome from 'chrome-promise';

const Popup = () => {
  const [activityData, setActivityData] = useState({});

  const updateActivityList = () => {
    chrome.storage.local.get('activityData', (result) => {
      const data = result.activityData || {};
      setActivityData(data);
    });
  };

  useEffect(() => {
    updateActivityList();
    const intervalId = setInterval(updateActivityList, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container">
      <h1>Activity Tracker</h1>
      <div id="activityList" className="scrollable">
        {Object.keys(activityData).map((tabUrl) => {
          const totalTime = activityData[tabUrl].totalTime;
          const seconds = Math.floor(totalTime / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);

          return (
            <div key={tabUrl}>
              {tabUrl}: {hours} hours {minutes % 60} minutes {seconds % 60} seconds
              <select
                value={activityData[tabUrl] || 0}
                onChange={(event) => {
                  const selectedTimeLimit = parseInt(event.target.value);
                  chrome.storage.local.set({ [tabUrl]: selectedTimeLimit });
                }}
              >
                <option value="0">Active (no limit)</option>
                <option value="60">1 minute</option>
                <option value="1800">30 minutes</option>
                <option value="3600">1 hour</option>
                <option value="7200">2 hours</option>
                {/* Add more time limit options as needed */}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Popup;
