import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountDetailSheet, ActiveFilters, ManipulationContentSheet, ManipulationPatternPanel, MetricGrid, Panel, RecordSheet, SituationMeta, SituationNav, SummaryBlock, type ActiveFilter } from "@/features/situasi/components";
import { useSituations } from "@/features/situasi/context";
import { accountProfiles, actors, clusters, comments, commentEmotions, commentPlatforms, commentStats, commentTrend, getAccountProfile, manipulationPatterns, narratives, narrativeTimeline, patternContents, records, sentimentByPlatform, trend, type DetailRecord, type ManipulationPattern } from "@/features/situasi/data";

export const Route = createFileRoute("/situasi/$slug/eksplorasi")({ head:()=>({meta:[{title:"Eksplorasi Situasi — SINTESA"},{name:"description",content:"Eksplorasi pola aktor, narasi, sentimen, emosi, dan hubungan antar-data."},{property:"og:title",content:"Eksplorasi Situasi — SINTESA"},{property:"og:description",content:"Workspace analitis pola aktor, narasi, dan sentimen."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}), component: Exploration });
const chartConfig={positive:{label:"Positif",color:"var(--color-chart-2)"},neutral:{label:"Netral",color:"var(--color-chart-1)"},negative:{label:"Negatif",color:"var(--color-chart-4)"},rising:{label:"Narasi Meningkat",color:"var(--color-chart-1)"},falling:{label:"Narasi Menurun",color:"var(--color-chart-4)"}};

function Exploration(){
  const { slug } = Route.useParams();
  const { findings, topics } = useSituations();
  const situation = [...topics, ...findings].find((item) => item.slug === slug);
  if (!situation) throw notFound();
  const [filters,setFilters]=useState<ActiveFilter[]>([]); const [selected,setSelected]=useState<DetailRecord>();
  const [selectedAccount,setSelectedAccount]=useState<string>();
  const [selectedPattern,setSelectedPattern]=useState<ManipulationPattern>();
  const [sentimentMode,setSentimentMode]=useState<"unggahan"|"komentar">("unggahan");
  const [selectedComment,setSelectedComment]=useState<(typeof comments)[number]>();
  const choose=(type:string,value:string)=>setFilters((current)=>[...current.filter((item)=>item.type!==type),{type,value}]);
  const openAccount=(username:string)=>{ if(accountProfiles[username]) setSelectedAccount(username); };
  return <PageShell eyebrow={`Situasi / ${situation.name}`} title={`Eksplorasi · ${situation.name}`} description="Siapa yang terlibat dan bagaimana pola informasi berkembang?">
    <SituationMeta item={situation}/><SituationNav slug={slug}/><ActiveFilters filters={filters} remove={(target)=>setFilters((current)=>current.filter((item)=>item!==target))} reset={()=>setFilters([])}/>
    <Tabs defaultValue="aktor"><TabsList className="mb-4 h-10 w-full justify-start overflow-x-auto bg-card"><TabsTrigger value="aktor">Aktor</TabsTrigger><TabsTrigger value="narasi">Narasi</TabsTrigger><TabsTrigger value="sentimen">Sentimen & Emosi</TabsTrigger></TabsList>
      <TabsContent value="aktor" className="space-y-4">
        <MetricGrid items={[{value:"31.870",label:"Total Aktor"},{value:"8.420",label:"Aktor Aktif"},{value:"126",label:"Aktor Pengaruh Tinggi"},{value:"284.320",label:"Total Interaksi"}]}/>
        <SummaryBlock title="Ringkasan Aktor" copy="Aktivitas percakapan terkonsentrasi pada beberapa cluster aktor. Tiga cluster terbesar berkontribusi terhadap lebih dari separuh interaksi pada isu demonstrasi nasional. Klik aktor di mana pun untuk membuka pendalaman akun (Account Deep Dive)." highlights={["4 cluster utama teridentifikasi.","126 aktor memiliki tingkat pengaruh tinggi.","37 akun mengalami lonjakan aktivitas signifikan.","Interaksi antar-cluster meningkat dalam 48 jam terakhir."]}/>
        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]"><Panel title="Network Aktor" description="Pilih node untuk membuka Detail Akun"><div className="relative h-80 overflow-hidden rounded-md bg-muted/20">
          <svg className="absolute inset-0 size-full" aria-hidden="true"><line x1="22%" y1="28%" x2="48%" y2="48%" stroke="var(--color-border)"/><line x1="48%" y1="48%" x2="75%" y2="30%" stroke="var(--color-border)"/><line x1="48%" y1="48%" x2="72%" y2="75%" stroke="var(--color-border)"/><line x1="22%" y1="28%" x2="25%" y2="72%" stroke="var(--color-border)"/></svg>
          {actors.map((actor,index)=><Button key={actor.name} variant="outline" size="sm" className="absolute h-10 rounded-full border-primary/40 bg-card text-[10px]" style={{left:[8,35,65,12,60][index]+"%",top:[18,42,20,68,68][index]+"%"}} onClick={()=>openAccount(actor.name)}>{actor.name}</Button>)}
        </div></Panel><Panel title="Cluster Aktor"> <div className="grid gap-3 sm:grid-cols-2">{clusters.map((cluster)=><Button key={cluster.name} variant="outline" className="h-auto min-h-28 justify-start p-3 text-left" onClick={()=>choose("cluster",cluster.name)}><span><strong className="block text-xs">{cluster.name}</strong><span className="mt-2 block font-display text-xl">{cluster.count}</span><span className="mt-1 block text-[10px] font-normal text-muted-foreground">{cluster.focus}</span></span></Button>)}</div></Panel></div>
        <Panel title="Aktor Paling Berpengaruh" description="Klik baris untuk membuka Detail Akun"><Table><TableHeader><TableRow><TableHead>Aktor</TableHead><TableHead>Platform</TableHead><TableHead>Interaksi</TableHead><TableHead>Reach</TableHead><TableHead>Pengaruh</TableHead><TableHead>Cluster</TableHead><TableHead>Narasi Dominan</TableHead></TableRow></TableHeader><TableBody>{actors.map((actor)=><TableRow key={actor.name} className="cursor-pointer" onClick={()=>openAccount(actor.name)}><TableCell className="font-medium text-primary underline-offset-2 hover:underline">{actor.name}</TableCell><TableCell>{actor.platform}</TableCell><TableCell>{actor.interactions.toLocaleString("id-ID")}</TableCell><TableCell>{actor.reach}</TableCell><TableCell>{actor.influence}</TableCell><TableCell>{actor.cluster}</TableCell><TableCell>{actor.narrative}</TableCell></TableRow>)}</TableBody></Table></Panel>
      </TabsContent>
      <TabsContent value="narasi" className="space-y-4">
        <MetricGrid items={[{value:"18",label:"Narasi Aktif"},{value:"5",label:"Narasi Dominan"},{value:"3",label:"Narasi Tumbuh Cepat"},{value:"6",label:"Narasi Negatif"}]}/>
        <SummaryBlock title="Ringkasan Narasi" copy="Narasi mengenai perluasan aksi menjadi narasi dengan pertumbuhan tercepat dalam 48 jam terakhir. Narasi tersebut mulai menyebar dari akun komunitas ke media dan akun publik." highlights={["“Aksi meluas” tumbuh 72%.","Narasi terkait kondisi ekonomi memiliki volume terbesar.","3 narasi mengalami pertumbuhan lintas platform.","2 narasi mengandung informasi yang belum terverifikasi."]}/>
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Tren Narasi" description="Volume konten menurut narasi terpilih"><ChartContainer config={chartConfig} className="h-72 w-full aspect-auto"><LineChart data={trend.slice(0,7)}><CartesianGrid vertical={false}/><XAxis dataKey="date"/><YAxis/><ChartTooltip content={<ChartTooltipContent/>}/><Line dataKey="volume" name="Aksi meluas" stroke="var(--color-chart-1)" strokeWidth={2}/><Line dataKey={(row)=>Math.round(row.volume*.72)} name="Kondisi ekonomi" stroke="var(--color-chart-3)" strokeWidth={2}/></LineChart></ChartContainer></Panel>
          <Panel title="Timeline Narasi Meningkat vs Menurun" description="Perbandingan volume narasi yang sedang naik dan yang mulai mereda"><ChartContainer config={chartConfig} className="h-72 w-full aspect-auto"><LineChart data={[...narrativeTimeline]}><CartesianGrid vertical={false}/><XAxis dataKey="date"/><YAxis/><ChartTooltip content={<ChartTooltipContent/>}/><ChartLegend content={<ChartLegendContent/>}/><Line dataKey="rising" stroke="var(--color-rising)" strokeWidth={2}/><Line dataKey="falling" stroke="var(--color-falling)" strokeWidth={2}/></LineChart></ChartContainer></Panel>
        </div>
        <Panel title="Aktor per Narasi"><div className="space-y-4">{narratives.slice(0,3).map((item)=><Button key={item.name} variant="ghost" className="h-auto w-full justify-start border-b border-border p-3 text-left" onClick={()=>choose("narrative",item.name)}><span><strong className="block text-xs">{item.name}</strong><span className="mt-1 block text-[10px] font-normal text-muted-foreground">@forum_mahasiswa · @info_aksi · @pantau_kota</span></span></Button>)}</div></Panel>
        <Panel title="Peringkat Narasi"><Table><TableHeader><TableRow><TableHead>Narasi</TableHead><TableHead>Konten</TableHead><TableHead>Aktor</TableHead><TableHead>Pertumbuhan</TableHead></TableRow></TableHeader><TableBody>{narratives.map((item)=><TableRow key={item.name} className="cursor-pointer" onClick={()=>choose("narrative",item.name)}><TableCell>{item.name}</TableCell><TableCell>{item.volume.toLocaleString("id-ID")}</TableCell><TableCell>{item.actors.toLocaleString("id-ID")}</TableCell><TableCell className="text-chart-2">{item.growth}</TableCell></TableRow>)}</TableBody></Table></Panel>
        <ManipulationPatternPanel patterns={manipulationPatterns} onSelect={setSelectedPattern} />
      </TabsContent>
      <TabsContent value="sentimen" className="space-y-4">
        <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Analisis:</span><div className="inline-flex rounded-md border border-border bg-card p-1">
          <Button size="sm" variant={sentimentMode==="unggahan"?"secondary":"ghost"} className="h-8" onClick={()=>setSentimentMode("unggahan")}>Unggahan</Button>
          <Button size="sm" variant={sentimentMode==="komentar"?"secondary":"ghost"} className="h-8" onClick={()=>setSentimentMode("komentar")}>Komentar</Button>
        </div></div>
        {sentimentMode==="unggahan" ? <>
          <MetricGrid items={[{value:"19%",label:"Positif"},{value:"35%",label:"Netral"},{value:"46%",label:"Negatif"},{value:"34%",label:"Emosi Dominan: Khawatir"}]}/>
          <SummaryBlock title="Ringkasan Sentimen Unggahan" copy="Sentimen negatif meningkat terutama pada pembicaraan mengenai dampak ekonomi dan informasi terkait potensi kericuhan. Emosi khawatir menjadi yang paling dominan. Metrik ini dihitung terpisah dari sentimen komentar." highlights={["Negatif mencapai 46% percakapan.","Khawatir menjadi emosi dominan sebesar 34%.","Media Online memiliki porsi netral tertinggi.","Sentimen dapat ditelusuri hingga konten sumber."]}/>
          <div className="grid gap-4 xl:grid-cols-2"><Panel title="Tren Sentimen Unggahan"><ChartContainer config={chartConfig} className="h-72 w-full aspect-auto"><LineChart data={trend.slice(0,7).map((item,index)=>({...item,positive:15+index,neutral:38-index,negative:47}))}><CartesianGrid vertical={false}/><XAxis dataKey="date"/><YAxis/><ChartTooltip content={<ChartTooltipContent/>}/><ChartLegend content={<ChartLegendContent/>}/><Line dataKey="positive" stroke="var(--color-positive)"/><Line dataKey="neutral" stroke="var(--color-neutral)"/><Line dataKey="negative" stroke="var(--color-negative)"/></LineChart></ChartContainer></Panel><Panel title="Distribusi Emosi"><div className="space-y-4">{[["Khawatir",34],["Marah",27],["Tidak Percaya",18],["Optimis",9],["Lainnya",12]].map(([name,value])=><Button key={name} variant="ghost" className="h-auto w-full gap-3 p-1" onClick={()=>choose("emotion",String(name))}><span className="w-24 text-left text-xs">{name}</span><span className="h-2 flex-1 rounded-full bg-muted"><span className="block h-full rounded-full bg-chart-3" style={{width:`${value}%`}}/></span><span className="w-8 text-xs">{value}%</span></Button>)}</div></Panel></div>
          <Panel title="Sentimen per Platform"><Table><TableHeader><TableRow><TableHead>Platform</TableHead><TableHead>Positif</TableHead><TableHead>Netral</TableHead><TableHead>Negatif</TableHead></TableRow></TableHeader><TableBody>{sentimentByPlatform.map((item)=><TableRow key={item.platform} className="cursor-pointer" onClick={()=>choose("platform",item.platform)}><TableCell>{item.platform}</TableCell><TableCell>{item.positive}%</TableCell><TableCell>{item.neutral}%</TableCell><TableCell>{item.negative}%</TableCell></TableRow>)}</TableBody></Table></Panel>
        </> : <>
          <MetricGrid items={[{value:commentStats.total.toLocaleString("id-ID"),label:"Total Komentar Terpantau"},{value:`${commentStats.positive}%`,label:"Positif"},{value:`${commentStats.neutral}%`,label:"Netral"},{value:`${commentStats.negative}%`,label:"Negatif"}]}/>
          <SummaryBlock title="Ringkasan Sentimen Komentar" copy="Komentar yang berhasil dikumpulkan menunjukkan dominasi sentimen negatif, lebih tinggi dibanding sentimen pada unggahan. Metrik komentar ditampilkan terpisah dan tidak dicampur dengan metrik sentimen unggahan." highlights={[`Total ${commentStats.total.toLocaleString("id-ID")} komentar terpantau.`,`Negatif mencapai ${commentStats.negative}% dari seluruh komentar.`,"Emosi Marah menjadi emosi dominan pada komentar.","Klik komentar untuk melihat posting induk dan konteksnya."]}/>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Tren Sentimen Komentar"><ChartContainer config={chartConfig} className="h-72 w-full aspect-auto"><LineChart data={[...commentTrend]}><CartesianGrid vertical={false}/><XAxis dataKey="date"/><YAxis/><ChartTooltip content={<ChartTooltipContent/>}/><ChartLegend content={<ChartLegendContent/>}/><Line dataKey="positive" stroke="var(--color-positive)"/><Line dataKey="neutral" stroke="var(--color-neutral)"/><Line dataKey="negative" stroke="var(--color-negative)"/></LineChart></ChartContainer></Panel>
            <Panel title="Emosi Dominan Komentar"><div className="space-y-4">{commentEmotions.map((item)=><Button key={item.name} variant="ghost" className="h-auto w-full gap-3 p-1" onClick={()=>choose("emotion",item.name)}><span className="w-24 text-left text-xs">{item.name}</span><span className="h-2 flex-1 rounded-full bg-muted"><span className="block h-full rounded-full bg-chart-3" style={{width:`${item.value}%`}}/></span><span className="w-8 text-xs">{item.value}%</span></Button>)}</div></Panel>
          </div>
          <Panel title="Platform Asal Komentar"><ChartContainer config={chartConfig} className="h-56 w-full aspect-auto"><BarChart data={[...commentPlatforms]}><CartesianGrid vertical={false}/><XAxis dataKey="platform"/><YAxis/><ChartTooltip content={<ChartTooltipContent/>}/><Bar dataKey="share" fill="var(--color-chart-1)" radius={3}/></BarChart></ChartContainer></Panel>
          <Panel title="Daftar Komentar" description="Klik komentar untuk melihat posting induk dan konteksnya"><Table><TableHeader><TableRow><TableHead className="min-w-56">Isi Komentar</TableHead><TableHead>Akun</TableHead><TableHead>Platform</TableHead><TableHead>Sentimen</TableHead><TableHead>Emosi</TableHead><TableHead>Waktu</TableHead></TableRow></TableHeader><TableBody>{comments.map((row)=><TableRow key={row.content} className="cursor-pointer" onClick={()=>setSelectedComment(row)}><TableCell className="max-w-72 text-xs leading-5">{row.content}</TableCell><TableCell>{row.actor}</TableCell><TableCell>{row.platform}</TableCell><TableCell>{row.sentiment}</TableCell><TableCell>{row.emotion}</TableCell><TableCell className="whitespace-nowrap text-muted-foreground">{row.time}</TableCell></TableRow>)}</TableBody></Table></Panel>
        </>}
      </TabsContent>
    </Tabs>
    <RecordSheet record={selected} onOpenChange={(open)=>!open&&setSelected(undefined)}/>
    <AccountDetailSheet account={selectedAccount?getAccountProfile(selectedAccount):undefined} onOpenChange={(open)=>!open&&setSelectedAccount(undefined)} />
    <ManipulationContentSheet pattern={selectedPattern} rows={selectedPattern?patternContents(selectedPattern.id):[]} onOpenChange={(open)=>!open&&setSelectedPattern(undefined)} />
    <RecordSheetForComment comment={selectedComment} onOpenChange={(open)=>!open&&setSelectedComment(undefined)} />
  </PageShell>;
}

function RecordSheetForComment({ comment, onOpenChange }: { comment: (typeof comments)[number] | undefined; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={Boolean(comment)} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-lg">
    <SheetHeader><SheetTitle>Detail Komentar & Posting Induk</SheetTitle><SheetDescription>Konteks komentar terhadap posting asal.</SheetDescription></SheetHeader>
    {comment && <div className="mt-6 space-y-4">
      <div className="rounded-md border border-border bg-muted/10 p-3"><span className="block text-[10px] uppercase text-muted-foreground">Posting Induk</span><p className="mt-1 text-sm leading-6">“{comment.parentPost}”</p></div>
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3"><span className="block text-[10px] uppercase text-primary">Komentar</span><p className="mt-1 text-sm leading-6">“{comment.content}”</p></div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-xs text-muted-foreground">Akun</dt><dd className="mt-1 font-medium">{comment.actor}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Platform</dt><dd className="mt-1 font-medium">{comment.platform}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Sentimen</dt><dd className="mt-1 font-medium">{comment.sentiment}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Emosi</dt><dd className="mt-1 font-medium">{comment.emotion}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Waktu</dt><dd className="mt-1 font-medium">{comment.time}</dd></div>
      </dl>
    </div>}
  </SheetContent></Sheet>;
}
