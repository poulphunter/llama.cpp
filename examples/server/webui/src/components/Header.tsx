import { useEffect, useState } from 'react';
import StorageUtils from '../utils/storage';
import { useAppContext } from '../utils/app.context';
import { classNames, isBoolean, isNumeric, isString } from '../utils/misc';
import daisyuiThemes from 'daisyui/src/theming/themes';
import { THEMES, CONFIG_DEFAULT, isDev } from '../Config';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector.tsx';
export const PROMPT_JSON = [
  {
    name: '',
    lang: '',
    config: CONFIG_DEFAULT,
  },
];

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState(StorageUtils.getTheme());
  const { setShowSettings } = useAppContext();
  const [selectedConfig, setSelectedConfig] = useState<number>(-1);
  const handleClick = () => {
    const elem = document.activeElement;
    if (elem) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      elem?.blur();
    }
  };

  const setTheme = (theme: string) => {
    StorageUtils.setTheme(theme);
    setSelectedTheme(theme);
  };
  const { config, saveConfig, resetSettings } = useAppContext();
  // clone the config object to prevent direct mutation
  const [localConfig] = useState<typeof CONFIG_DEFAULT>(
    JSON.parse(JSON.stringify(config))
  );

  const [promptSelectOptions, setPromptSelectOptions] = useState<
    { key: number; value: string }[]
  >([]);
  const [promptSelectConfig, setPromptSelectConfig] = useState<
    typeof PROMPT_JSON | null
  >(null);
  useEffect(() => {
    document.body.setAttribute('data-theme', selectedTheme);
    document.body.setAttribute(
      'data-color-scheme',
      // @ts-expect-error daisyuiThemes complains about index type, but it should work
      daisyuiThemes[selectedTheme]?.['color-scheme'] ?? 'auto'
    );
  }, [selectedTheme]);

  useEffect(() => {
    fetch('/prompts.config.json')
      .then((response) => response.json())
      .then((data) => {
        const prt: { key: number; value: string }[] = [];
        if (data && data.prompts) {
          setPromptSelectConfig(data.prompts);
          Object.keys(data.prompts).forEach(function (key) {
            const name = data.prompts[key].name;
            prt.push({ key: parseInt(key), value: name });
          });
        }
        setPromptSelectOptions(prt);
      })
      .catch((error) => {
        if (isDev) {
          console.log(error);
        }
      });
  }, []);
  useEffect(() => {
    if (promptSelectConfig !== null && selectedConfig == -1) {
      setSelectedConfig(0);
      //selectPrompt(0);
      if (isDev) console.log('Saving config', promptSelectConfig[0].config);
      saveConfig(promptSelectConfig[0].config);
      resetSettings();
    }
  }, [promptSelectConfig, selectedConfig, saveConfig, resetSettings]);

  const { isGenerating, viewingChat } = useAppContext();
  const isCurrConvGenerating = isGenerating(viewingChat?.conv.id ?? '');

  const removeConversation = () => {
    if (isCurrConvGenerating || !viewingChat) return;
    const convId = viewingChat?.conv.id;
    if (window.confirm(t('conversations.deleteConfirm'))) {
      StorageUtils.remove(convId);
      navigate('/');
    }
  };

  const downloadConversation = () => {
    if (isCurrConvGenerating || !viewingChat) return;
    const convId = viewingChat?.conv.id;
    const conversationJson = JSON.stringify(viewingChat, null, 2);
    const blob = new Blob([conversationJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${convId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectPrompt = (value: number) => {
    setSelectedConfig(value);
    if (
      promptSelectConfig &&
      promptSelectConfig[value] &&
      promptSelectConfig[value].config
    ) {
      const newConfig: typeof CONFIG_DEFAULT = JSON.parse(
        JSON.stringify(localConfig)
      );
      // validate the config
      for (const key in promptSelectConfig[value].config) {
        const val =
          promptSelectConfig[value].config[key as keyof typeof CONFIG_DEFAULT];
        const mustBeBoolean = isBoolean(
          CONFIG_DEFAULT[key as keyof typeof CONFIG_DEFAULT]
        );
        const mustBeString = isString(
          CONFIG_DEFAULT[key as keyof typeof CONFIG_DEFAULT]
        );
        const mustBeNumeric = isNumeric(
          CONFIG_DEFAULT[key as keyof typeof CONFIG_DEFAULT]
        );
        if (mustBeString) {
          if (!isString(val)) {
            alert(`Value for ${key} must be string`);
            return;
          }
        } else if (mustBeNumeric) {
          const trimedValue = val.toString().trim();
          const numVal = Number(trimedValue);
          if (isNaN(numVal) || !isNumeric(numVal) || trimedValue.length === 0) {
            alert(`Value for ${key} must be numeric`);
            return;
          }
          // force conversion to number
          // @ts-expect-error this is safe
          newConfig[key] = numVal;
        } else if (mustBeBoolean) {
          if (!isBoolean(val)) {
            alert(`Value for ${key} must be boolean`);
            return;
          }
        } else {
          console.error(`Unknown default type for key ${key}`);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        newConfig[key] = val;
      }
      if (isDev) console.log('Saving config', newConfig);
      saveConfig(newConfig);
      resetSettings();
    }
  };

  return (
    <div className="flex flex-row items-center pt-6 pb-6 sticky top-0 z-10 bg-base-100">
      {/* open sidebar button */}
      <label htmlFor="toggle-drawer" className="btn btn-ghost lg:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-list"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
          />
        </svg>
      </label>

      <div className="grow text-2xl font-bold ml-2">llama.cpp</div>
      {/* action buttons (top right) */}
      <div className="flex items-center">
        {viewingChat && (
          <div className="dropdown dropdown-end">
            {/* "..." button */}
            <button
              tabIndex={0}
              role="button"
              className="btn m-1"
              disabled={isCurrConvGenerating}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-three-dots-vertical"
                viewBox="0 0 16 16"
              >
                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
              </svg>
            </button>
            {/* dropdown menu */}
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li onClick={downloadConversation}>
                <a>Download</a>
              </li>
              <li className="text-error" onClick={removeConversation}>
                <a>Delete</a>
              </li>
            </ul>
          </div>
        )}
        {promptSelectOptions.length > 0 ? (
          <div className="tooltip tooltip-bottom" data-tip="Settings">
            <div className="dropdown dropdown-end dropdown-bottom">
              <div tabIndex={0} role="button" className="btn m-1">
                {/* settings button */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-gear"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl h-80 overflow-y-auto"
              >
                <li>
                  <input
                    type="radio"
                    name="settings"
                    className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                    aria-label="Manual settings"
                    value="Manual settings"
                    onChange={() => setShowSettings(true)}
                  />
                </li>
                {[...promptSelectOptions].map((opt) => (
                  <li key={opt.key}>
                    <input
                      type="radio"
                      name="settings"
                      className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                      aria-label={opt.value}
                      value={opt.value}
                      checked={selectedConfig === opt.key}
                      onChange={(e) =>
                        e.target.checked && selectPrompt(opt.key)
                      }
                      onClick={handleClick}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="tooltip tooltip-bottom" data-tip="Settings">
            <button className="btn" onClick={() => setShowSettings(true)}>
              {/* settings button */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-gear"
                viewBox="0 0 16 16"
              >
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
              </svg>
            </button>
          </div>
        )}

        {/* theme controller is copied from https://daisyui.com/components/theme-controller/ */}
        <div className="tooltip tooltip-bottom" data-tip="Themes">
          <div className="dropdown dropdown-end dropdown-bottom">
            <div tabIndex={0} role="button" className="btn m-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-palette2"
                viewBox="0 0 16 16"
              >
                <path d="M0 .5A.5.5 0 0 1 .5 0h5a.5.5 0 0 1 .5.5v5.277l4.147-4.131a.5.5 0 0 1 .707 0l3.535 3.536a.5.5 0 0 1 0 .708L10.261 10H15.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5H3a3 3 0 0 1-2.121-.879A3 3 0 0 1 0 13.044m6-.21 7.328-7.3-2.829-2.828L6 7.188zM4.5 13a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0M15 15v-4H9.258l-4.015 4zM0 .5v12.495zm0 12.495V13z" />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl h-80 overflow-y-auto"
            >
              <li>
                <button
                  className={classNames({
                    'btn btn-sm btn-block btn-ghost justify-start': true,
                    'btn-active': selectedTheme === 'auto',
                  })}
                  onClick={() => setTheme('auto')}
                >
                  auto
                </button>
              </li>
              {THEMES.map((theme) => (
                <li key={theme}>
                  <input
                    type="radio"
                    name="theme-dropdown"
                    className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                    aria-label={theme}
                    value={theme}
                    checked={selectedTheme === theme}
                    onChange={(e) => e.target.checked && setTheme(theme)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <LanguageSelector></LanguageSelector>
      </div>
    </div>
  );
}
