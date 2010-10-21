/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is App Dashboard, dashboard.js
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Michael Hanson <mhanson@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */


APP_STORAGE_DOMAIN = "http://myapps.mozillalabs.com";

// Singleton instance of the Apps object:
var gApps = null;

// The selected app
var gSelectedInstall = null;

// Display mode:
/* const */ ROOT = 1;
/* const */ APP_INFO = 2;
var gDisplayMode = ROOT;

// Various display settings
var gIconSize = 48;// get from pref


$(document).ready(function() {
    // can this user use myapps?
    var w = window;
    if (w.JSON && w.postMessage && w.localStorage) {
        $("#container").fadeIn(500);
        try {
            // Construct our Apps handle
            gApps = new Apps(new StorageDecorator({}));

            // Draw it
            gDisplayMode = ROOT;
            try {
            } catch (e) {
                gApps.logError("Error while initializing apps: " + e);
            }
            render();
        } catch (e) {
            alert(e);
        }
    } else {
        $("#unsupportedBrowser").fadeIn(500);
    }
});

function elem(type, clazz) {
	var e = document.createElement(type);
  if (clazz) e.setAttribute("class", clazz);
  return e;
}

// Creates an opener for an app tab.  The usual behavior
// applies - if the app is already running, we switch to it.
// If the app is not running, we create a new app tab and
// launch the app into it.
function makeOpenAppTabFn(app, targetURL)
{ 
  if (navigator.apps && navigator.apps.openAppTab)
  {
    return function(evt) {
      navigator.apps.openAppTab(app, targetURL, {background:evt.metaKey});
    }
  }
  else
  {
    return function(evt) {
      window.open(targetURL, "_blank");
    }
  }
  return null;
}

// Render the contents of the "apps" element by creating canvases
// and labels for all apps.
function render()
{
  var box = $("#appList");
  box.empty();
  var selectedBox = null;
  for (var i=0;i<gApps.installs.length;i++)
  {
    try {
      var install = gApps.installs[i];
      box.append($("<div>").text(install.app.name).attr({style:"cursor:pointer"}).click(makeOpenAppTabFn(install.app, 
        install.app.base_url + install.app.launch_path)));
    } catch (e) {
      gApps.logError("Error while creating application icon for app " + i + ": " + e);
    }
  }
}

function onMessage(event)
{
  // unfreeze request message into object
  var msg = JSON.parse(event.data);
  if(!msg || !msg.cmd) {
    return;
  }
  
  if (msg.cmd == "dashboard::installedApps")
  {
    try {
    var storage = new StorageDecorator(msg.installs);
    gApps = new Apps(storage);
    render();
  } catch (e) {alert(e);}
  }
}
function StorageDecorator(dataMap) {
  this.dataMap = dataMap;
  var count = 0;
  for (var i in dataMap) count++;
  this.length = count;
}
StorageDecorator.prototype = {
  getItem: function(key) {
    return this.dataMap[key];
  },
  key: function(index) {
    // TODO: honestly not sure if dictionary order is stable in every browser
    // Replace with flat array of k,v pairs to be sure?
    var count = 0;
    for (var checkKey in this.dataMap) {
      if (count == index) return checkKey;
      count++;
    }
  },
  removeItem: function(key) {
    delete this.dataMap[key];
  }
}


function onFocus(event)
{
  if (gApps) {
    gApps.reload();
    render();
  }
}


if (window.addEventListener) {
    window.addEventListener('message', onMessage, false);
} else if(window.attachEvent) {
    window.attachEvent('onmessage', onMessage);
}

if (window.addEventListener) {
    window.addEventListener('focus', onFocus, false);
} else if(window.attachEvent) {
    window.attachEvent('onfocus', onFocus);
}

$(function(){
  window.parent.postMessage(JSON.stringify({cmd: 'dashboard::ready'}),"*");
});
