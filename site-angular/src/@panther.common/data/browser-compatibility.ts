import { cloneDeep } from "lodash";

const data = [
  {
    "os": "Windows",
    "version": "Windows 10 Pro",
    "chrome": "96.0.4664.45",
    "firefox": "94.0.2",
    "edge": "96.0.1054.41",
    "safari": "not tested"
  },
  {
    "os": "MacOS",
    "version": "Big Sur 11.5.294.0.1",
    "chrome": "96.0.4664.55",
    "firefox": "94.0.1",
    "edge": "not tested",
    "safari": "14.1.2"
  },
  {
    "os": "Linux",
    "version": "not tested",
    "chrome": "not tested",
    "firefox": "not tested",
    "edge": "not tested",
    "safari": "not tested"
  }
]

export const browserVersions = cloneDeep(data)