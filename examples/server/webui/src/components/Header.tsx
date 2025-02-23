import { useEffect, useState } from 'react';
import StorageUtils from '../utils/storage';
import { useAppContext } from '../utils/app.context';
import { classNames, isBoolean, isNumeric, isString } from '../utils/misc';
import daisyuiThemes from 'daisyui/src/theming/themes';
import { THEMES, CONFIG_DEFAULT, isDev } from '../Config';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import useStateCallback from '../utils/UseStateCallback.tsx';

type languageOption = { language: string; code: string };

const languageOptions: languageOption[] = [
  { language: 'English', code: 'en' },
  { language: 'French', code: 'fr' },
  { language: 'German', code: 'de' },
  { language: 'Spanish', code: 'es' },
  { language: 'Italian', code: 'it' },
];

const PROMPT_JSON = [
  {
    name: '',
    lang: '',
    config: CONFIG_DEFAULT,
  },
];

export default function Header() {
  const [lang, setLanguage] = useStateCallback(i18next.language);
  const { t, i18n } = useTranslation();
  if (isDev) {
    console.log('Language:' + lang);
  }
  useEffect(() => {
    document.body.dir = i18n.dir();
  }, [i18n, i18n.language]);

  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState(StorageUtils.getTheme());
  const { setShowSettings, closeDropDownMenu } = useAppContext();

  const setTheme = (theme: string) => {
    StorageUtils.setTheme(theme);
    setSelectedTheme(theme);
  };
  const { saveConfig, resetSettings } = useAppContext();

  const [promptSelectOptions, setPromptSelectOptions] = useState<
    { key: number; value: string }[]
  >([]);
  const [promptSelectConfig, setPromptSelectConfig] = useState<
    typeof PROMPT_JSON | null
  >(null);
  const [promptSelectFirstConfig, setPromptSelectFirstConfig] =
    useState<number>(-1);
  const [selectedConfig, setSelectedConfig] = useState<number>(-1);
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
          let firstConfigSet = false;
          Object.keys(data.prompts).forEach(function (key) {
            if (lang == data.prompts[key].lang) {
              if (!firstConfigSet) {
                firstConfigSet = true;
                setPromptSelectFirstConfig(parseInt(key));
              }
              const name = data.prompts[key].name;
              prt.push({ key: parseInt(key), value: name });
            }
          });
        }
        setPromptSelectOptions(prt);
      })
      .catch((error) => {
        if (isDev) {
          console.log(error);
        }
      });
  }, [lang]);

  useEffect(() => {
    if (promptSelectConfig !== null && selectedConfig == -1) {
      setSelectedConfig(0);
      //selectPrompt(0);
      if (isDev)
        console.log(
          'Saving config',
          promptSelectConfig[promptSelectFirstConfig].config
        );
      saveConfig(CONFIG_DEFAULT);
      saveConfig(promptSelectConfig[promptSelectFirstConfig].config);
      resetSettings();
    }
  }, [
    promptSelectConfig,
    selectedConfig,
    saveConfig,
    resetSettings,
    promptSelectFirstConfig,
  ]);

  const { isGenerating, viewingChat } = useAppContext();
  const isCurrConvGenerating = isGenerating(viewingChat?.conv.id ?? '');

  const removeConversation = () => {
    if (isCurrConvGenerating || !viewingChat) return;
    const convId = viewingChat?.conv.id;
    if (window.confirm(t('Header.deleteConfirm'))) {
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
        JSON.stringify(CONFIG_DEFAULT)
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
        const mustBeArray = Array.isArray(
          CONFIG_DEFAULT[key as keyof typeof CONFIG_DEFAULT]
        );
        if (mustBeString) {
          if (!isString(val)) {
            console.log(`Value for ${key} must be string`);
            console.log(value);
            return;
          }
        } else if (mustBeNumeric) {
          const trimedValue = val.toString().trim();
          const numVal = Number(trimedValue);
          if (isNaN(numVal) || !isNumeric(numVal) || trimedValue.length === 0) {
            console.log(`Value for ${key} must be numeric`);
            console.log(value);
            return;
          }
          // force conversion to number
          // @ts-expect-error this is safe
          newConfig[key] = numVal;
        } else if (mustBeBoolean) {
          if (!isBoolean(val)) {
            console.log(`Value for ${key} must be boolean`);
            console.log(value);
            return;
          }
        } else if (mustBeArray) {
          if (!Array.isArray(val)) {
            console.log(`Value for ${key} must be array`);
            console.log(val);
            return;
          }
        } else {
          console.error(`Unknown default type for key ${key}`);
          console.log(value);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        newConfig[key] = val;
      }
      if (isDev) console.log('Saving config', newConfig);
      saveConfig(CONFIG_DEFAULT);
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
                <a>{t('Header.downloadBtn')}</a>
              </li>
              <li className="text-error" onClick={removeConversation}>
                <a>{t('Header.deleteBtn')}</a>
              </li>
            </ul>
          </div>
        )}
        {promptSelectOptions.length > 0 ? (
          <div
            className="tooltip tooltip-bottom"
            data-tip={t('Header.tooltipSettings')}
          >
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
                    aria-label={t('Header.manualSettings')}
                    value={t('Header.manualSettings')}
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
                      onClick={() => {
                        closeDropDownMenu('');
                      }}
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
        <div
          className="tooltip tooltip-bottom"
          data-tip={t('Header.tooltipTheme')}
        >
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
        <div
          className="tooltip tooltip-bottom"
          data-tip={t('Header.tooltipLanguage')}
        >
          <div className="dropdown dropdown-end dropdown-bottom">
            <div tabIndex={0} role="button" className="btn m-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M11 5a.75.75 0 0 1 .688.452l3.25 7.5a.75.75 0 1 1-1.376.596L12.89 12H9.109l-.67 1.548a.75.75 0 1 1-1.377-.596l3.25-7.5A.75.75 0 0 1 11 5Zm-1.24 5.5h2.48L11 7.636 9.76 10.5ZM5 1a.75.75 0 0 1 .75.75v1.261a25.27 25.27 0 0 1 2.598.211.75.75 0 1 1-.2 1.487c-.22-.03-.44-.056-.662-.08A12.939 12.939 0 0 1 5.92 8.058c.237.304.488.595.752.873a.75.75 0 0 1-1.086 1.035A13.075 13.075 0 0 1 5 9.307a13.068 13.068 0 0 1-2.841 2.546.75.75 0 0 1-.827-1.252A11.566 11.566 0 0 0 4.08 8.057a12.991 12.991 0 0 1-.554-.938.75.75 0 1 1 1.323-.707c.049.09.099.181.15.271.388-.68.708-1.405.952-2.164a23.941 23.941 0 0 0-4.1.19.75.75 0 0 1-.2-1.487c.853-.114 1.72-.185 2.598-.211V1.75A.75.75 0 0 1 5 1Z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl h-80 overflow-y-auto"
            >
              {languageOptions.map(({ language, code }, key) => (
                <li key={key}>
                  <input
                    type="radio"
                    name="theme-dropdown"
                    className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                    aria-label={language}
                    value={language}
                    onChange={() => {
                      setLanguage(code, (n) => {
                        const prt: { key: number; value: string }[] = [];
                        if (promptSelectConfig) {
                          let firstConfigSet = false;
                          Object.keys(promptSelectConfig).forEach(
                            function (key) {
                              if (n == promptSelectConfig[parseInt(key)].lang) {
                                if (!firstConfigSet) {
                                  firstConfigSet = true;
                                  setPromptSelectFirstConfig(parseInt(key));
                                  if (isDev)
                                    console.log(
                                      'Saving config',
                                      promptSelectConfig[parseInt(key)].config
                                    );
                                  saveConfig(CONFIG_DEFAULT);
                                  saveConfig(
                                    promptSelectConfig[parseInt(key)].config
                                  );
                                }
                                const name =
                                  promptSelectConfig[parseInt(key)].name;
                                prt.push({ key: parseInt(key), value: name });
                              }
                            }
                          );
                        }
                        resetSettings();
                        setPromptSelectOptions(prt);
                      });
                      i18next.changeLanguage(code);
                    }}
                    onClick={() => {
                      closeDropDownMenu('');
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
