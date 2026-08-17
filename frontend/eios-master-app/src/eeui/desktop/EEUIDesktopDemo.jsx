import "./EEUIDesktopDemo.css";

import {
  Database,
  FileText,
  FolderTree,
  Map,
  Settings,
} from "lucide-react";

import {
  EEUIWorkspace,
} from "../layouts";

import {
  EEUIPanel,
  EEUIRibbon,
  EEUIButton,
  EEUIBadge,
} from "../components";

const ribbonTabs = [
  { id: "home", label: "Home" },
  { id: "survey", label: "Survey" },
  { id: "logic", label: "Logic" },
  { id: "analytics", label: "Analytics" },
  { id: "deployment", label: "Deployment" },
];

function ribbonCommands() {
  return (
    <>
      <div className="eeui-ribbon__group">

        <EEUIButton size="small">
          New Survey
        </EEUIButton>

        <EEUIButton
          size="small"
          variant="secondary"
        >
          Save
        </EEUIButton>

      </div>

      <div className="eeui-ribbon__group">

        <EEUIButton
          size="small"
          variant="success"
        >
          Publish
        </EEUIButton>

      </div>
    </>
  );
}

export default function EEUIDesktopDemo() {

  return (

    <EEUIWorkspace

      title="EIOS Enterprise Desktop"

      subtitle="Survey Studio Alpha"

      ribbon={
        <EEUIRibbon
          tabs={ribbonTabs}
          renderCommands={ribbonCommands}
          actions={
            <EEUIBadge
              variant="success"
              dot
            >
              Framework Ready
            </EEUIBadge>
          }
        />
      }

      explorer={

        <EEUIPanel
          title="Explorer"
        >

          <div className="desktop-tree">

            <div className="desktop-tree-item">
              <FolderTree size={18}/>
              Survey Project
            </div>

            <div className="desktop-tree-item">
              <FileText size={18}/>
              Questionnaire
            </div>

            <div className="desktop-tree-item">
              <Map size={18}/>
              GIS
            </div>

            <div className="desktop-tree-item">
              <Database size={18}/>
              Analytics
            </div>

            <div className="desktop-tree-item">
              <Settings size={18}/>
              Settings
            </div>

          </div>

        </EEUIPanel>

      }

      canvas={

        <EEUIPanel
          title="Canvas"
        >

          <div className="desktop-canvas">

            <h2>
              Survey Studio
            </h2>

            <p>

              Welcome to the first Enterprise Desktop
              built for EIOS.

            </p>

          </div>

        </EEUIPanel>

      }

      inspector={

        <EEUIPanel
          title="Inspector"
        >

          <p>
            Select an object to inspect.
          </p>

        </EEUIPanel>

      }

      statusBar={

        <div className="desktop-status">

          Ready

          <span>

            EIOS v0.1 Alpha

          </span>

        </div>

      }

    />

  );

}