import './App.css';
import { Routes, Route } from 'react-router-dom';
import UltimateKernelAcademy from './UltimateKernelAcademy';

function App() {
    return (
        <div className="App">
            <Routes>
                {/* Route with problem ID parameter */}
                <Route path="/problem/:problemId" element={<UltimateKernelAcademy />} />
                {/* Default homepage route */}
                <Route path="/" element={<UltimateKernelAcademy />} />
                {/* Catch-all route - redirect to home */}
                <Route path="*" element={<UltimateKernelAcademy />} />
            </Routes>
        </div>
    );
}

export default App;
