import { HashRouter, Outlet, Route, Routes } from 'react-router';
import Header from './components/Header';
import ConversationList from './components/ConversationList';
import { AppContextProvider, useAppContext } from './utils/app.context';
import ChatScreen from './components/ChatScreen';
import SettingDialog from './components/SettingDialog';

function App() {
  return (
    <HashRouter>
      <div className="flex flex-row drawer lg:drawer-open">
        <AppContextProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/chat/:convId" element={<ChatScreen />} />
              <Route path="*" element={<ChatScreen />} />
            </Route>
          </Routes>
        </AppContextProvider>
      </div>
    </HashRouter>
  );
}

function AppLayout() {
  const { showSettings, setShowSettings, settingsSeed } = useAppContext();
  return (
    <>
      <ConversationList />
      <div
        className="drawer-content grow flex flex-col h-screen w-screen mx-auto px-4 overflow-auto"
        id="main-scroll"
      >
        <Header />
        <Outlet />
      </div>
      {
        <>
          <button
            type="button"
            id="dropdown-close-helper"
            className="h-0 w-0"
          />
          <SettingDialog
            key={settingsSeed}
            show={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </>
      }
    </>
  );
}

export default App;
