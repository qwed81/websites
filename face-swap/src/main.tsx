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

async function getPngBlob(url: string) {
  try {
    // Fetch the image
    const response = await fetch(url);
    
    /*
    // Check if the response is ok and is a PNG
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (!response.headers.get('content-type').includes('image/png')) {
      throw new Error('Not a PNG image!');
    */
    
    // Convert directly to Blob
    const blob = await response.blob();
    
    return blob;
  } catch (error) {
    console.error('Error fetching PNG:', error);
    throw error;
  }
}

function App() {
  let [presetOpen, setPresetOpen] = useState(false);
  let [selectedImages, setSelectedImage] = useState<[string | null, string | null]>([null, null]);
  let [createdImage, setCreatedImage] = useState<string | null>(null);

  async function onUploadOrPreset(selectedImage0: string | null, selectedImage1: string | null) {
    if (selectedImage0 == null || selectedImage1 == null) return; 

    let blob0 = await getPngBlob(selectedImage0);
    let blob1 = await getPngBlob(selectedImage1);
   
    let data = new FormData();
    data.append('source_image', blob0);
    data.append('target_image', blob1);

    const response = await fetch('http://localhost:8000/swap-face', {
      method: 'POST',
      body: data,
    });
    // Create URL from blob
    const url = URL.createObjectURL(await response.blob());
    setCreatedImage(url)
  }

  function onFileUpload(currentSelect: number, e: any) {
    const file = e.target.files[0];
    if (file) {
        // Create a blob URL from the file
        const imageSrc = URL.createObjectURL(file);
        if (currentSelect == 0) {
          setSelectedImage([imageSrc, selectedImages[1]]);
          onUploadOrPreset(imageSrc, selectedImages[1]);
        }
        else {
          setSelectedImage([selectedImages[0], imageSrc]);
          onUploadOrPreset(selectedImages[0], imageSrc);
        }
    }
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
      <h1 className="text-3xl p-4 text-center">脸幻 (jiāohuàn) Face</h1>
      <div className="grid gap-4 mx-4 grid-cols-3">

        {[0,1].map(id => (
        <div className="grid grid-cols-2 grid-rows-[1fr_auto]">
          <div className="bg-slate-950 border-1 border-slate-800 col-span-2">
            {selectedImages[id] && <img className="w-full h-full object-cover" src={selectedImages[id]}/>}
          </div>
          <button className="bg-slate-950  border-1 border-slate-800 p-1" onClick={() => onPresetMenuOpen(id)}>Select Preset</button>
          <label className="text-center align-center border-1 border-slate-800 p-1" htmlFor={"upload" + id}>Upload</label>
          <input className="hidden" id={"upload" + id} type="file" onChange={e => onFileUpload(id, e)}></input>
        </div>
        ))}

        <div className="grid grid-rows-[1fr_auto] bg-slate-950 border border-slate-800">
          {!createdImage && <div className="h-64"></div>}
          {createdImage && <img className="w-full h-full object-cover" src={createdImage}/>}
          <button className="bg-slate-950  border-1 border-slate-800 p-1">Download</button>
        </div>
      </div>
      <h2 className="text-lg mx-4 my-2">About Us</h2>
      <p className="mx-4">
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
