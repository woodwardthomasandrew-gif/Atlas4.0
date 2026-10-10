import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listAssets, deleteAsset, saveAsset, type AssetRecord } from "@app/db/assetStore";
import { Button, Card, EmptyState, Input } from "@ui/components";
import { HANDOUT_TYPE, type HandoutData } from "../schema";
import { HANDOUT_TEMPLATES } from "../templates";
import "../handout.css";

export function HandoutListPage(): JSX.Element {
  const [items,setItems]=useState<AssetRecord[]|null>(null), [name,setName]=useState("Untitled handout"); const navigate=useNavigate();
  const reload=():void=>{void listAssets(HANDOUT_TYPE).then(setItems);}; useEffect(reload,[]);
  const create=async(templateId:string):Promise<void>=>{const template=HANDOUT_TEMPLATES.find(x=>x.id===templateId)!;const id=crypto.randomUUID();await saveAsset({id,type:HANDOUT_TYPE,name:name.trim()||template.name,data:template.create()});navigate(`/handout-studio/${id}`);};
  return <div className="handout-library"><header><div><h1>Handout Studio</h1><p>Create editable, print-ready campaign documents.</p></div><label>New handout name<Input value={name} onChange={e=>setName(e.target.value)}/></label></header>
    <section className="handout-template-grid">{HANDOUT_TEMPLATES.map(t=><Card key={t.id}><h3>{t.name}</h3><Button variant="primary" onClick={()=>void create(t.id)}>Create</Button></Card>)}</section>
    <h2>Your handouts</h2>{items?.length===0&&<EmptyState title="No handouts yet" description="Choose a template above to make your first in-world document."/>}{items&&<div className="handout-library-grid">{items.map(item=>{const d=item.data as HandoutData;return <Card key={item.id}><div className="handout-card"><Link to={`/handout-studio/${item.id}`}><strong>{item.name}</strong><span>{Array.isArray(d.pages)?d.pages.length:0} page(s)</span><small>Updated {new Date(item.updated_at).toLocaleDateString()}</small></Link><div><Button onClick={async()=>{const next=window.prompt("Rename handout",item.name);if(next?.trim()){await saveAsset({...item,name:next.trim()});reload();}}}>Rename</Button><Button onClick={async()=>{await saveAsset({id:crypto.randomUUID(),type:HANDOUT_TYPE,name:`${item.name} (Copy)`,data:JSON.parse(JSON.stringify(item.data))});reload();}}>Duplicate</Button><Button variant="danger" onClick={async()=>{if(window.confirm(`Delete “${item.name}”?`)){await deleteAsset(item.id);reload();}}}>Delete</Button></div></div></Card>;})}</div>}{items===null&&<p>Loading handouts…</p>}</div>;
}
