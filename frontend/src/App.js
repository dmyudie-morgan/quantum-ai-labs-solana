import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Vision from "@/pages/Vision";
import Technology from "@/pages/Technology";
import Research from "@/pages/Research";
import ResearchArticle from "@/pages/ResearchArticle";
import Roadmap from "@/pages/Roadmap";
import Ecosystem from "@/pages/Ecosystem";
import Assistant from "@/pages/Assistant";
import Tools from "@/pages/Tools";
import QuantumLab from "@/pages/QuantumLab";
import Benchmark from "@/pages/Benchmark";
import Web3 from "@/pages/Web3";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/vision" element={<Vision />} />
            <Route path="/technology" element={<Technology />} />
            <Route path="/research" element={<Research />} />
            <Route path="/research/:slug" element={<ResearchArticle />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/ecosystem" element={<Ecosystem />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/quantum-field" element={<QuantumLab />} />
            <Route path="/benchmark" element={<Benchmark />} />
            <Route path="/web3" element={<Web3 />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: "#101018", border: "1px solid rgba(255,255,255,.1)", color: "#f1f1f5" } }} />
    </div>
  );
}

export default App;
