import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { useState } from 'react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

let currentSelect = 0;

function App() {
  let [presetOpen, setPresetOpen] = useState(false);
  let [selectedImages, setSelectedImage] = useState<[string | null, string | null]>([null, null]);
  let [createdImage, setCreatedImage] = useState<string | null>(null);

  function onUploadOrPreset(selectedImage0: string | null, selectedImage1: string | null) {
    if (selectedImage0 == null || selectedImage1 == null) return; 
    setCreatedImage(selectedImage0);
  }

  function onPresetMenuOpen(id: number) {
    currentSelect = id;
    setPresetOpen(true);
  }

  function onPresetSelection(imageSrc: string) {
    setPresetOpen(false);
    if (currentSelect == 0) {
      setSelectedImage([imageSrc, selectedImages[1]]);
      onUploadOrPreset(imageSrc, selectedImages[1]);
    }
    else {
      setSelectedImage([selectedImages[0], imageSrc]);
      onUploadOrPreset(selectedImages[0], imageSrc);
    }
  }

  return (
    <>
      <h1 className="text-lg p-2 text-center">脸幻 (jiāohuàn) Face</h1>
      <div className="grid grid-cols-3">

        {[0,1].map(id => (
        <div className="grid grid-cols-2 grid-rows-[1fr_auto]">
          <div className="bg-slate-950 border-1 border-slate-800 col-span-2">
            {selectedImages[id] && <img className="w-full h-full object-cover" src={selectedImages[id]}/>}
          </div>
          <label htmlFor={"upload" + id} className="bg-slate-950 text-center border-1 border-slate-800 p-1">Upload File</label>
          <input id={"upload" + id} className="hidden" type="file"/>
          <button className="bg-slate-950  border-1 border-slate-800 p-1" onClick={() => onPresetMenuOpen(id)}>Select Preset</button>
        </div>
        ))}

        <div className="grid grid-rows-[1fr_auto] bg-slate-950 border border-slate-800">
          {!createdImage && <div className="h-64"></div>}
          {createdImage && <img className="w-full h-full object-cover" src={createdImage}/>}
          <button className="bg-slate-950  border-1 border-slate-800 p-1">Download</button>
        </div>
      </div>
      <p className="p-2">
        Face Swap is a website written with react typescript and a python fastapi backend as part of our
        website a week challenge. 
        It uses a custom machine learning model trained on the SMU superpod! For more information please contact us on linkedin.
        #OpenToWork
      </p>


      {presetOpen &&
      <div className="fixed top-0 left-0 w-screen h-screen flex justify-center align-center z-1000 bg-black" onClick={() => setPresetOpen(false)}>
        <div className="bg-white p-1 round-lg relative flex" onClick={(e) => { e.stopPropagation() }}>
          {[0, 1, 2, 3].map(x => {
            let imgPath = '/face' + x + '.webp';
            return <img className="h-32 w-32" src={imgPath} onClick={() => onPresetSelection(imgPath)}/>
          })}
        </div>
      </div>
      }
    </>
  )
}
