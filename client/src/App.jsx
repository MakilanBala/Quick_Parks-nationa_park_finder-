import './App.css'
import { BrowserRouter} from 'react-router-dom' // ✅ Add this
import { AuthProvider } from './components/AuthProvider' // ✅ Add this
import AppRoutes from './routes/AppRoutes' // ✅ Add this
import { NpsDataProvider } from "./components/NpsDataProvider";




function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NpsDataProvider>
          <AppRoutes />
        </NpsDataProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
