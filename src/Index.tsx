import App from './App.tsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Index() {
return (
<BrowserRouter>
<Routes>
<Route path="/bash-scripting-trainer/*" element={<App />} />
</Routes>
</BrowserRouter>
);
}

export default Index;