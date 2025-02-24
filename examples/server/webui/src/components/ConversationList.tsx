import { useEffect, useState } from 'react';
import { classNames } from '../utils/misc';
import { Conversation } from '../utils/types';
import StorageUtils from '../utils/storage';
import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

export function ConversationListButton() {
    return (
    <>
        {/* open sidebar button */}
        <label htmlFor="toggle-conversation-list" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                 stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/>
            </svg>

        </label>
    </>
    );
}

export default function ConversationList() {
    const {t} = useTranslation();
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
          <div className="drawer lg:drawer-open">
              <input id="toggle-conversation-list" type="checkbox" className="drawer-toggle"/>
              <div className="drawer-content flex flex-col items-center justify-center">
                  <label htmlFor="toggle-conversation-list" className="btn btn-primary drawer-button lg:hidden">
                      Open drawer
                  </label>
              </div>
              <div className="drawer-side h-screen lg:h-screen z-50 lg:max-w-64">
                  <label
                      htmlFor="toggle-conversation-list"
                      aria-label={t('Sidebar.sidebarClose')}
                      className="drawer-overlay"
                  >
                  </label>
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
                                  'toggle-conversation-list'
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
                                      'toggle-conversation-list'
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
          </div>
      </>
  );
}
