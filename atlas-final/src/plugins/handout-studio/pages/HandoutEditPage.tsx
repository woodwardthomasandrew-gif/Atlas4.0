import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Input } from "@ui/components";
import { getAsset, saveAsset } from "@app/db/assetStore";
import { useAutosave, useSaveContext, type SaveReason } from "@app/save/SaveProvider";
import { useShortcutAction } from "@app/shortcuts/ShortcutProvider";
import { exportHandoutPdf } from "../exportPdf";
import { HandoutEditor } from "../HandoutEditor";
import { HANDOUT_TYPE, createHandout, validateHandout, type HandoutData } from "../schema";
import "../handout.css";

export function HandoutEditPage(): JSX.Element {
  const {id=""}=useParams(), navigate=useNavigate(), [name,setName]=useState(""), [data,setData]=useState(createHandout), [loaded,setLoaded]=useState(false), [error,setError]=useState(""), [dirty,setDirty]=useState(false); const lastSaved=useRef(""), historyReady=useRef(false), past=useRef<HandoutData[]>([]), future=useRef<HandoutData[]>([]); const {notifySaved}=useSaveContext();
  useEffect(()=>{let live=true;void(async()=>{try{const asset=await getAsset(id);if(!asset||asset.type!==HANDOUT_TYPE)throw new Error("Handout not found.");const check=validateHandout(asset.data);if(!check.valid)throw new Error(`This handout could not be opened: ${check.errors.join(" ")}`);if(live){setName(asset.name);setData(asset.data as HandoutData);lastSaved.current=JSON.stringify(asset.data);historyReady.current=true;}}catch(e){if(live)setError(e instanceof Error?e.message:"Could not load handout.");}finally{if(live)setLoaded(true);}})();return()=>{live=false;};},[id]);
  const save=async(reason:SaveReason):Promise<boolean>=>{if(!dirty)return true;const check=validateHandout(data);if(!check.valid||!name.trim()){if(reason!=="auto")setError(check.errors.join(" ")||"Name is required.");return false;}try{await saveAsset({id,type:HANDOUT_TYPE,name:name.trim(),data});lastSaved.current=JSON.stringify(data);setDirty(false);setError("");return true;}catch(e){setError(e instanceof Error?`Save failed: ${e.message}`:"Save failed. Try again.");return false;}};
  const manual=async():Promise<void>=>{if(await save("manual")){notifySaved("manual");navigate("/handout-studio");}};
  const [editorRevision,setEditorRevision]=useState(0); const undo=():void=>{const previous=past.current.pop();if(previous){future.current.push(data);setData(previous);setDirty(JSON.stringify(previous)!==lastSaved.current);setEditorRevision((n)=>n+1);}}; const redo=():void=>{const next=future.current.pop();if(next){past.current.push(data);setData(next);setDirty(JSON.stringify(next)!==lastSaved.current);setEditorRevision((n)=>n+1);}};
  useAutosave(save,loaded);useShortcutAction("save",manual,loaded);useShortcutAction("undo",undo,loaded);useShortcutAction("redo",redo,loaded);
  const update=(next:HandoutData):void=>{if(historyReady.current){past.current.push(data);if(past.current.length>100)past.current.shift();future.current=[];}setData(next);setDirty(JSON.stringify(next)!==lastSaved.current);};
  const renderPdf=async():Promise<Uint8Array>=>{const check=validateHandout(data);if(!check.valid)throw new Error(check.errors.join(" "));return exportHandoutPdf(data);};
  const exportPdf=async():Promise<void>=>{try{const bytes=await renderPdf();await window.atlas.app.savePdf(bytes,`${name||"handout"}.pdf`);setError("");}catch(e){setError(e instanceof Error?`PDF export failed: ${e.message}`:"PDF export failed. Try again.");}};
  const printPdf=async():Promise<void>=>{try{const bytes=await renderPdf();await window.atlas.app.printPdf(bytes);setError("");}catch(e){setError(e instanceof Error?`Print preparation failed: ${e.message}`:"Print preparation failed. Try again.");}};
  if(!loaded)return <p>Loading handout…</p>;
  if(error&&!name)return <section className="handout-recovery"><h1>Handout unavailable</h1><p role="alert">{error}</p><Link to="/handout-studio">Return to library</Link></section>;
  return <div className="handout-edit-page"><header><Link to="/handout-studio">← Library</Link><label>Name<Input value={name} onChange={e=>{setName(e.target.value);setDirty(true);}}/></label><span role="status">{error|| (dirty?"Unsaved changes":"Saved")}</span><Button onClick={()=>void printPdf()}>Open PDF to Print</Button><Button onClick={()=>void exportPdf()}>Export PDF</Button><Button variant="primary" onClick={()=>void manual()}>Save & close</Button></header><HandoutEditor key={`${id}-${editorRevision}`} assetId={id} data={data} onChange={update}/></div>;
}
