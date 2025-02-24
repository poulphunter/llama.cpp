import { HashRouter, Outlet, Route, Routes } from 'react-router';
import Header from './components/Header';
import ConversationList from './components/ConversationList';
import { AppContextProvider } from './utils/app.context';
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
  return (
    <>
      <div className="drawer lg:drawer-open">
        <input
          id="toggle-conversation-list"
          type="checkbox"
          className="drawer-toggle"
        />
        <div className="drawer-content h-screen">
          {/* right drawer */}
          <div className="flex min-h-full">
            <div id="mainBlock" className="block w-full">
              <Header />
              <Outlet />
            </div>
            <div
              id="settingBlock"
              className="w-full hidden xl:block bg-base-200"
            >
              <SettingDialog />
            </div>
          </div>
          {/* /right drawer */}
        </div>
        {/* left drawer */}
        <ConversationList />
        {/* /left drawer */}
      </div>
      <button type="button" id="dropdown-close-helper" className="h-0 w-0" />
    </>
  );
}

export default App;
