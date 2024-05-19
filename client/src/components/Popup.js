import React, { useState, useEffect } from 'react';
import chrome from 'webextension-polyfill';
import './Popup.css';

const Popup = () => {
  const [urlNames, setUrlNames] = useState([]);
  const [timers, setTimers] = useState({});
  const [selectOptions, setSelectOptions] = useState({});
  const [restrictedSites, setRestrictedSites] = useState([]);

  const updateUrlNames = (data) => {
    const names = Object.keys(data);
    setUrlNames(names);
  };

  const updateTimers = (data) => {
    setTimers(data);
  };

  const fetchTimeLimit = (tabUrl) => {
    chrome.storage.local.get(tabUrl, (result) => {
      const timeLimit = result[tabUrl] || '0';
      setSelectOptions((prevOptions) => ({
        ...prevOptions,
        [tabUrl]: timeLimit,
      }));
    });
  };

  const updateActivityList = () => {
    chrome.storage.local.get(['activityData', 'restrictedSites']).then((result) => {
      const data = result.activityData || {};
      const updatedOptions = {};
      Object.entries(data).forEach(([tabUrl, tabData]) => {
        updatedOptions[tabUrl] = tabData.timeLimit;
      });
      setSelectOptions(updatedOptions);

      updateUrlNames(data);
      updateTimers(data);

      const restrictedSitesList = result.restrictedSites || [];
      setRestrictedSites(restrictedSitesList);
    });
  };

  useEffect(() => {
    updateActivityList();
    const intervalId = setInterval(updateActivityList, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSelectChange = (event, tabUrl) => {
    const selectedTimeLimit = event.target.value;
    setSelectOptions((prevOptions) => ({
      ...prevOptions,
      [tabUrl]: selectedTimeLimit,
    }));
    chrome.storage.local.set({ [tabUrl]: selectedTimeLimit });
  };

  const handleAddSite = () => {
    const inputElement = document.getElementById('addInput');
    const newSite = inputElement.value.trim();
    if (newSite && !restrictedSites.includes(newSite)) {
      const updatedSites = [...restrictedSites, newSite];
      setRestrictedSites(updatedSites);
      chrome.storage.local.set({ 'restrictedSites': updatedSites });
      inputElement.value = '';
    }
  };

  const handleDeleteSite = () => {
    const inputElement = document.getElementById('deleteInput');
    const siteToRemove = inputElement.value.trim();
    if (siteToRemove && restrictedSites.includes(siteToRemove)) {
      const updatedSites = restrictedSites.filter((site) => site !== siteToRemove);
      setRestrictedSites(updatedSites);
      chrome.storage.local.set({ 'restrictedSites': updatedSites });
      inputElement.value = '';
    }
  };

  return (
    <div className="container">
      <h1>Activity Tracker</h1>
      <div id="activityList" className="scrollable">
        {urlNames.map((tabUrl) => {
          const totalTime = timers[tabUrl] ? timers[tabUrl].totalTime : 0;
          const seconds = Math.floor(totalTime / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);

          return (
            <div key={tabUrl}>
              {tabUrl}: {hours} hours {minutes % 60} minutes {seconds % 60} seconds
              <select
                value={selectOptions[tabUrl] || '0'}
                onChange={(event) => handleSelectChange(event, tabUrl)}
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

      <h2>Restricted Sites</h2>
      <div id="restrictedList" className="scrollable">
        {restrictedSites.length === 0 ? (
          <p>No restricted sites added</p>
        ) : (
          restrictedSites.map((site, index) => (
            <div key={index}>{site}</div>
          ))
        )}
      </div>
      <input type="text" id="addInput" placeholder="Enter URL to restrict" />
      <button id="addButton" onClick={handleAddSite}>Add</button>
      <input type="text" id="deleteInput" placeholder="Enter URL to remove from restricted list" />
      <button id="deleteButton" onClick={handleDeleteSite}>Delete</button>
    </div>
  );
};

export default Popup;
