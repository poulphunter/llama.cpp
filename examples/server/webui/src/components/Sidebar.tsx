import { useEffect, useState } from 'react';
import { classNames } from '../utils/misc';
import { Conversation } from '../utils/types';
import StorageUtils from '../utils/storage';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currConv, setCurrConv] = useState<Conversation | null>(null);

  useEffect(() => {
    StorageUtils.getOneConversation(params.convId ?? '').then(setCurrConv);
  }, [params.convId]);

  useEffect(() => {
    const handleConversationChange = async () => {
      setConversations(await StorageUtils.getAllConversations());
    };
    StorageUtils.onConversationChanged(handleConversationChange);
    handleConversationChange();
    return () => {
      StorageUtils.offConversationChanged(handleConversationChange);
    };
  }, []);

  return (
    <>
      <input id="toggle-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-side h-screen lg:h-screen z-50 lg:max-w-64">
        <label
          htmlFor="toggle-drawer"
          aria-label={t('Sidebar.sidebarClose')}
          className="drawer-overlay"
        ></label>
        <div className="flex flex-col bg-base-200 min-h-full max-w-64 py-4 px-4">
          <div className="flex flex-row items-center justify-between mb-4 mt-4">
            <h2 className="font-bold ml-4">{t('Sidebar.Conversations')}</h2>

            {/* close sidebar button */}
            <label htmlFor="toggle-drawer" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-arrow-bar-left"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M12.5 15a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5M10 8a.5.5 0 0 1-.5.5H3.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L3.707 7.5H9.5a.5.5 0 0 1 .5.5"
                />
              </svg>
            </label>
          </div>

          {/* list of conversations */}
          <div
            className={classNames({
              'btn btn-ghost justify-start': true,
              'btn-active': !currConv,
            })}
            onClick={() => {
              navigate('/');
              const elem = document.getElementById(
                'toggle-drawer'
              ) as HTMLInputElement;
              if (elem && elem.checked) {
                elem.click();
              }
            }}
          >
            {t('Sidebar.newConversation')}
          </div>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={classNames({
                'btn btn-ghost justify-start font-normal': true,
                'btn-active': conv.id === currConv?.id,
              })}
              onClick={() => {
                navigate(`/chat/${conv.id}`);
                const elem = document.getElementById(
                  'toggle-drawer'
                ) as HTMLInputElement;
                if (elem && elem.checked) {
                  elem.click();
                }
              }}
              dir="auto"
            >
              <span className="truncate">{conv.name}</span>
            </div>
          ))}
          <div className="text-center text-xs opacity-40 mt-auto mx-4">
            {t('Sidebar.convInformation')}
          </div>
        </div>
      </div>
    </>
  );
}
