let activeTabId = null;
let activeTabUrl = null;
let activityData = {};

// Function to fetch user data from storage
function fetchUserData(callback) {
  chrome.storage.sync.get('userData', function (result) {
    if (result.userData) {
      userData = result.userData;
    }
    if (typeof callback === 'function') {
      callback();
    }
  });
}


// Function to save user data to storage
function saveUserData() {
  chrome.storage.sync.set({ userData });
}

// Initialize user data on extension start
fetchUserData();

chrome.tabs.onActivated.addListener((activeInfo) => {
  let tabId = activeInfo.tabId;
  activeTabId = tabId;
  chrome.tabs.get(tabId, (tab) => {
    activeTabUrl = tab.url;
    if (!activityData[activeTabUrl]) {
      activityData[activeTabUrl] = { totalTime: 0, lastVisited: new Date().getTime(), timeLimit: 0 };
    }
    activityData[activeTabUrl].lastVisited = new Date().getTime();
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabId === tabId && activeTabUrl) {
    let currentTime = new Date().getTime();
    activityData[activeTabUrl].totalTime += currentTime - activityData[activeTabUrl].lastVisited;
    activeTabId = null;
    activeTabUrl = null;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    chrome.storage.local.get('restrictedSites', (result) => {
      let restrictedSites = result.restrictedSites || [];
      let tabUrl = tab.url;
      if (restrictedSites.includes(tabUrl)) {
        chrome.tabs.remove(tabId);
        chrome.windows.getCurrent((currentWindow) => {
          let width = 400;
          let height = 200;
          let left = Math.round((currentWindow.width - width) / 2);
          let top = Math.round((currentWindow.height - height) / 2);

          chrome.windows.create({
            url: 'blocked.html',
            type: 'popup',
            width: width,
            height: height,
            left: left,
            top: top
          });
        });
      }
    });
  }
});

setInterval(() => {
  if (activeTabId && activeTabUrl) {
    let currentTime = new Date().getTime();
    activityData[activeTabUrl].totalTime += currentTime - activityData[activeTabUrl].lastVisited;
    activityData[activeTabUrl].lastVisited = currentTime;

    // Check time limit for active tab
    chrome.storage.local.get(activeTabUrl, (result) => {
      let timeLimit = result[activeTabUrl] || 0; // Default time limit is 0 (no limit)
      activityData[activeTabUrl].timeLimit = timeLimit; // Update time limit in activity data
      if (timeLimit > 0 && activityData[activeTabUrl].totalTime >= timeLimit * 1000) {
        chrome.tabs.remove(activeTabId, () => {
          delete activityData[activeTabUrl]; // Remove from activity data
        });
        activeTabId = null;
        activeTabUrl = null;
      }
    });

    // Save activity data
    chrome.storage.local.set({ activityData });
  }
}, 1000);
