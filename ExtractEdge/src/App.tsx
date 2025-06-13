import { useState, ChangeEvent, FormEvent } from 'react';

interface ExtractedData {
  [key: string]: string;
}

const API_BASE = 'http://localhost:5000';

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [pdfImages, setPdfImages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setExtractedData(null);
      setPdfImages([]);
      setSelectedPage(0);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
      const txt = await res.text();
      let data: any = {};
      try { data = JSON.parse(txt); } catch {}
      if (!res.ok) throw new Error(data.detail || txt || `HTTP ${res.status}`);

      setExtractedData(data.extracted_data || {});
      setPdfImages(Array.isArray(data.pdf_images) ? data.pdf_images : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (data: ExtractedData) => {
    const header = 'Parameter,Value\n';
    const rows = Object.entries(data)
      .map(([k, v]) => `"${k}","${v}"`)
      .join('\n');
    return header + rows;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCellChange = (key: string, value: string) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, [key]: value });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-50">
      <h1 className="text-4xl font-bold mb-6 text-red-800">
        EXTRACT EDGE
      </h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg p-6 rounded-lg bg-red-100 border border-red-200 mb-8"
      >
        <label className="block mb-4">
          <span className="text-base font-medium text-gray-700">Select File</span>
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileChange}
            disabled={loading}
            className="mt-2 w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
          />
        </label>

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full py-2 rounded font-semibold bg-red-600 hover:bg-red-700 text-white transition"
        >
          {loading ? 'Processing...' : 'Upload & Process'}
        </button>
      </form>

      {errorMsg && (
        <div className="mb-6 text-sm text-red-600">{errorMsg}</div>
      )}

      {extractedData && (
        <div className="w-full max-w-3xl mb-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Results</h2>

          <dl className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {Object.entries(extractedData).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-gray-600 mb-1">{key}</dt>
                <dd className="text-gray-900 bg-gray-100 p-2 rounded">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => downloadFile(JSON.stringify(extractedData, null, 4), 'data.json', 'application/json')}
              className="flex-1 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition"
            >
              Download JSON
            </button>
            <button
              onClick={() => downloadFile(generateCSV(extractedData), 'data.csv', 'text/csv')}
              className="flex-1 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition"
            >
              Download CSV
            </button>
          </div>
        </div>
      )}

      {pdfImages.length > 0 && (
        <div className="w-full max-w-4xl">
          <div className="flex justify-center mb-4 space-x-2">
            {pdfImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedPage(i)}
                className={`px-3 py-1 rounded border ${
                  i === selectedPage ? 'border-red-600' : 'border-gray-300'
                } text-gray-700`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={() => setZoomLevel((z) => z + 0.1)}
              className="py-1 px-3 rounded bg-red-600 hover:bg-red-700 text-white transition text-sm"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.1, z - 0.1))}
              className="py-1 px-3 rounded bg-red-600 hover:bg-red-700 text-white transition text-sm"
            >
              -
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-inner overflow-auto">
            <img
              src={`data:image/png;base64,${pdfImages[selectedPage]}`}
              alt={`Page ${selectedPage + 1}`}
              style={{ transform: `scale(${zoomLevel})` }}
              className="mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;



// import { useState, ChangeEvent, FormEvent } from 'react';

// interface ExtractedData {
//   [key: string]: string;
// }

// const API_BASE = 'http://localhost:5000';

// const App = () => {
//   const [file, setFile] = useState<File | null>(null);
//   const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
//   const [pdfImages, setPdfImages] = useState<string[]>([]);
//   const [selectedPage, setSelectedPage] = useState<number>(0);
//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState<string>('');
//   const [zoomLevel, setZoomLevel] = useState<number>(1);

//   const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files?.length) {
//       setFile(e.target.files[0]);
//       setExtractedData(null);
//       setPdfImages([]);
//       setSelectedPage(0);
//       setErrorMsg('');
//     }
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!file) return;

//     setLoading(true);
//     setErrorMsg('');

//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//       const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
//       const txt = await res.text();
//       let data: any = {};
//       try { data = JSON.parse(txt); } catch {}
//       if (!res.ok) throw new Error(data.detail || txt || `HTTP ${res.status}`);

//       setExtractedData(data.extracted_data || {});
//       setPdfImages(Array.isArray(data.pdf_images) ? data.pdf_images : []);
//     } catch (err: any) {
//       setErrorMsg(err.message || 'Network error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generateCSV = (data: ExtractedData) => {
//     const header = 'Parameter,Value\n';
//     const rows = Object.entries(data)
//       .map(([k, v]) => `"${k}","${v}"`)
//       .join('\n');
//     return header + rows;
//   };

//   const downloadFile = (content: string, filename: string, mimeType: string) => {
//     const blob = new Blob([content], { type: mimeType });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const handleCellChange = (key: string, value: string) => {
//     if (extractedData) {
//       setExtractedData({ ...extractedData, [key]: value });
//     }
//   };

//   return (
//     <div className="main-wrapper min-h-screen flex flex-col items-center p-4">
//       <h1 className="text-4xl font-bold mb-6 text-gray-900">Extract Edge</h1>

//       <form onSubmit={handleSubmit} className="$1bg-red-100$2">
//         <label className="block mb-4">
//           <span className="text-lg font-medium text-gray-700">Upload PDF/TXT/DOCX File</span>
//           <input
//             type="file"
//             accept=".pdf,.txt,.docx"
//             onChange={handleFileChange}
//             disabled={loading}
//             className="mt-2 block w-full border border-gray-300 p-2 rounded bg-white text-gray-800"
//           />
//         </label>

//         <button
//           type="submit"
//           disabled={!file || loading}
//           className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded font-semibold"
//         >
//           {loading ? 'Processing...' : 'Upload and Process'}
//         </button>
//       </form>

//       {errorMsg && (
//         <div className="mt-4 text-red-600">
//           <p>{errorMsg}</p>
//         </div>
//       )}

//       {extractedData && (
//         <div className="mt-6 w-full max-w-4xl mb-6 bg-white p-6 rounded shadow">
//           <h2 className="text-2xl font-bold mb-4 text-gray-800">Retrieved Information</h2>

//           <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {Object.entries(extractedData).map(([key, value]) => (
//               <div key={key} className="flex flex-col">
//                 <dt className="text-sm font-medium text-gray-600 mb-1">{key}</dt>
//                 <dd>
//                   <input
//                     type="text"
//                     value={value}
//                     onChange={(e) => handleCellChange(key, e.target.value)}
//                     className="border border-gray-300 p-2 rounded w-full text-gray-900"
//                   />
//                 </dd>
//               </div>
//             ))}
//           </dl>

//           <div className="flex gap-4 mt-6">
//             <button
//               onClick={() => downloadFile(JSON.stringify(extractedData, null, 4), 'response.json', 'application/json')}
//               className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
//             >
//               Download JSON
//             </button>
//             <button
//               onClick={() => downloadFile(generateCSV(extractedData), 'extracted_data.csv', 'text/csv')}
//               className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
//             >
//               Download CSV
//             </button>
//           </div>
//         </div>
//       )}

//       {pdfImages.length > 0 && (
//         <div className="mt-6 w-full max-w-6xl flex flex-col md:flex-row gap-6">
//           <div className="flex mb-4 gap-2">
//             {pdfImages.map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setSelectedPage(i)}
//                 className={`px-3 py-1 rounded border ${i === selectedPage ? 'border-blue-600' : 'border-gray-300'} text-gray-700`}
//               >
//                 {i + 1}
//               </button>
//             ))}
//           </div>

//           <div className="flex mb-4 gap-2">
//             <button
//               onClick={() => setZoomLevel((z) => z + 0.1)}
//               className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
//             >
//               Zoom In
//             </button>
//             <button
//               onClick={() => setZoomLevel((z) => Math.max(0.1, z - 0.1))}
//               className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
//             >
//               Zoom Out
//             </button>
//           </div>

//           <div className="overflow-auto bg-white p-4 rounded shadow">
//             <img
//               src={`data:image/png;base64,${pdfImages[selectedPage]}`}
//               alt={`PDF Page ${selectedPage + 1}`}
//               style={{ transform: `scale(${zoomLevel})` }}
//               className="w-full"
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;
