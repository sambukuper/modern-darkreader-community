import type {
    ExtensionData,
    Theme,
    TabInfo,
    MessageUItoBG,
    UserSettings,
    MessageCStoBG,
    MessageBGtoUI,
} from '../definitions';
import {MessageTypeBGtoUI, MessageTypeUItoBG} from '../utils/message';
import {isFirefox} from '../utils/platform';

import {makeFirefoxHappy} from './make-firefox-happy';

export interface ExtensionAdapter {
  collect: () => Promise<ExtensionData>;
  changeSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setTheme: (theme: Partial<Theme>) => void;
  toggleActiveTab: () => void;
  loadConfig: (options: { local: boolean }) => Promise<void>;
}

export default class Messenger {
    private static adapter: ExtensionAdapter;
    private static changeListenerCount: number;

    static init(adapter: ExtensionAdapter): void {
        Messenger.adapter = adapter;
        Messenger.changeListenerCount = 0;

        chrome.runtime.onMessage.addListener(Messenger.messageListener);
        chrome.runtime.onConnect.addListener(Messenger.portListener);
    }

    private static messageListener(
        message: MessageUItoBG | MessageCStoBG,
        sender: chrome.runtime.MessageSender,
        sendResponse: (
      response:
        | { data?: ExtensionData | TabInfo; error?: string }
        | 'unsupportedSender',
    ) => void,
    ) {
        if (isFirefox && makeFirefoxHappy(message, sender, sendResponse)) {
            return;
        }
        const isUIMessage = Boolean(
            message &&
            typeof (message as any).type === 'string' &&
            (message as any).type.startsWith('ui-bg-')
        );
        if (isUIMessage) {
            Messenger.onUIMessage(message as MessageUItoBG, sendResponse);
            if ((message as any).type === MessageTypeUItoBG.GET_DATA) {
                return true;
            }
        }
    }

    private static portListener(port: chrome.runtime.Port) {
        let promise: Promise<ExtensionData | TabInfo | null>;
        switch (port.name) {
            case MessageTypeUItoBG.GET_DATA:
                promise = Messenger.adapter.collect();
                break;
            default:
                return;
        }
        promise
            .then((data) => port.postMessage({data}))
            .catch((error) => port.postMessage({error: error ? (error.message || String(error)) : 'Unknown error'}));
    }

    private static onUIMessage(
        {type, data}: MessageUItoBG,
        sendResponse: (response: {
      data?: ExtensionData | TabInfo;
      error?: string;
    }) => void,
    ) {
        switch (type) {
            case MessageTypeUItoBG.GET_DATA:
                Messenger.adapter
                    .collect()
                    .then((data) => sendResponse({data}))
                    .catch((err) => {
                        console.error('Failed to collect data:', err);
                        sendResponse({error: String(err)});
                    });
                break;
            case MessageTypeUItoBG.SUBSCRIBE_TO_CHANGES:
                Messenger.changeListenerCount++;
                break;
            case MessageTypeUItoBG.UNSUBSCRIBE_FROM_CHANGES:
                Messenger.changeListenerCount--;
                break;
            case MessageTypeUItoBG.CHANGE_SETTINGS:
                Messenger.adapter.changeSettings(data);
                break;
            case MessageTypeUItoBG.SET_THEME:
                Messenger.adapter.setTheme(data);
                break;
            case MessageTypeUItoBG.TOGGLE_ACTIVE_TAB:
                Messenger.adapter.toggleActiveTab();
                break;
            case MessageTypeUItoBG.LOAD_CONFIG:
                Messenger.adapter.loadConfig(data);
                break;
            default:
                break;
        }
    }

    static reportChanges(data: ExtensionData): void {
        if (Messenger.changeListenerCount > 0) {
            chrome.runtime.sendMessage<MessageBGtoUI>({
                type: MessageTypeBGtoUI.CHANGES,
                data,
            })?.catch?.(() => {
                Messenger.changeListenerCount = 0;
            });
        }
    }
}
