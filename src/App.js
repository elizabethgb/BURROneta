import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import '../node_modules/primereact/resources/themes/bootstrap4-dark-purple/theme.css';
import '../node_modules/primereact/resources/primereact.css';
import '../node_modules/primeflex/primeflex.css';
import '../node_modules/primeicons/primeicons.css';
import { BreadCrumb } from 'primereact/breadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ContextMenu } from 'primereact/contextmenu';
import { Button } from 'primereact/button';
import ColumnSelectionDialog from './components/ColumnsSelectionDialog';
import MatchDetailsDialog from './components/MatchDetailsDialog';

function App() {

  const [rawData, setRawData] = useState([]); 
  const [seasons, setSeasons] = useState([]);
  const [groupByOptions, setGroupByOptions] = useState([]);
  const [selected, setSelected] = useState("");
  const [currentGroupBy, setCurrentGroupBy] = useState({});
  const [currentFilters, setCurrentFilters] = useState([]);
  const [currentSeason, setCurrentSeason] = useState(0);
  const [opOption, setOpOption] = useState(0);
  const [breadCrumbsItems, setBreadCrumbsItems] = useState([]);
  const [calculatedData, setCalculatedData] = useState([]);
  const [matchesDialogVisible, setMatchesDialogVisible] = useState(false);
  const [matchesDialogData, setMatchesDialogData] = useState([]);
  const [matchesDialogHeader, setMatchesDialogHeader] = useState("");
  const [columnsDialogVisible, setColumnsDialogVisible] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([
    {label: "Games", column: <Column key="games" field="games" header="Games" sortable/>},
    {label: "Kills", column: <Column key="kills" field="kills" header="Kills" body={(rowData) => total_team(rowData.kills, rowData.team_kills)} sortable/>},
    {label: "Deaths", column: <Column key="deaths" field="deaths" header="Deaths" body={(rowData) => total_team(rowData.deaths, rowData.team_deaths)} sortable/>},
    {label: "Assists", column: <Column key="assists" field="assists" header="Assists" body={(rowData) => total_team(rowData.assists, rowData.team_assists)} sortable/>},
    {label: "KDA", column: <Column key="kda" field="kda" header="KDA" body={(rowData) => formatNumber((rowData.kills+rowData.assists)/(rowData.deaths?rowData.deaths:1))} sortable sortFunction={({data, order}) => data.sort((a, b) => (((a.deaths===0 ? a.kills+a.assists : (a.kills+a.assists)/a.deaths) - (b.deaths===0 ? b.kills+b.assists : (b.kills+b.assists)/b.deaths)) * order) /*otra opción: (param) => param.data.sort((a, b)=>{})*/)}/>},
    {label: "KP", column: <Column key="kp" field="kp" header="KP" body={(rowData) => formatNumber((rowData.kills+rowData.assists)/(rowData.team_kills?rowData.team_kills:1), true)} sortable sortFunction={({data, order}) => data.sort((a, b) => (((a.team_kills===0 ? a.kills+a.assists : (a.kills+a.assists)/a.team_kills) - (b.team_kills===0 ? b.kills+b.assists : (b.kills+b.assists)/b.team_kills)) * order))}/>},
    {label: "Damage", column: <Column key="totalDamageDealtToChampions" field="totalDamageDealtToChampions" header="Damage" body={(rowData) => total_team(rowData.totalDamageDealtToChampions, rowData.team_totalDamageDealtToChampions, true)} sortable/>},
    {label: "Gold", column: <Column key="goldEarned" field="goldEarned" header="Gold" body={(rowData) => total_team(rowData.goldEarned, rowData.team_goldEarned, true)} sortable/>},
    {label: "CS", column: <Column key="cs" field="cs" header="CS" body={(rowData) => formatNumber(rowData.totalMinionsKilled+rowData.neutralMinionsKilled)} sortable sortFunction={({data, order}) => data.sort((a, b) => (((a.totalMinionsKilled+a.neutralMinionsKilled) - (b.totalMinionsKilled+b.neutralMinionsKilled)) * order))}/>},
    {label: "VS", column: <Column key="visionScore" field="visionScore" header="VS" body={(rowData) => formatNumber(rowData.visionScore)} sortable/>},
    {label: "Winrate", column: <Column key="win" field="win" header="Winrate" body={(rowData) => formatNumber(rowData.win, true)} sortable/>}
  ]);
  const [hiddenColumns, setHiddenColumns] = useState([]);

  const getWindowDimensions = () => {
		const { innerWidth: width, innerHeight: height } = window;
		return {
			width,
			height
		};
	}
	const handleResize = () => {
		setWindowDimensions(getWindowDimensions());
	}
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  const cm = useRef(null);
  const dt = useRef(null);
  const home = {icon: 'pi pi-home', command: () => {processRawData({key:"summoner", label:"Summoner"}, [])}}

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    fetch("data/seasons.json")
      .then((result) => result.json())
      .then((seasonsList) => {
        seasonsList.forEach((season, pos) => {season.id=pos}); //otra opción: seasonsList = seasonsList.map((season, pos) => {return {...season, id: pos}});
        setSeasons(seasonsList);
        let posDefaultSeason = 0;
        seasonsList.forEach((season) => {if (season.default) posDefaultSeason=season.id});
        setCurrentSeason(posDefaultSeason);
        fetch("data/archivos.json")
          .then((result) => result.json())
          .then((filesList) => {
              let dataTemp = [];
              let promises = [];
              filesList.forEach(file => {
                promises.push(fetch(`data/${file}.json`)
                  .then((result) => result.json())
                  .then((processed) => {
                    processed.forEach((elem) => dataTemp.push(elem)); //Otras opciones: dataTemp = [...dataTemp, ...processed]; o dataTemp = dataTemp.concat(processed); o dataTemp.push(...processed);
                  })
                )
              });
              Promise.all(promises).then(() => processRawData({key:"summoner", label:"Summoner"}, [], seasonsList[posDefaultSeason], dataTemp));
          })
      });
    fetch("data/groupByOptions.json")
      .then((result) => result.json())
      .then((GBlist) => {setGroupByOptions(GBlist)});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const select = (event, option, rowData) => { //rowData sólo viene si option es 0 (de la tabla)
    setOpOption(option);
    cm.current.show(event);
    if (option === 0) setSelected(rowData[currentGroupBy.key]);
  }

  const matchesDialogShow = (rowData) => {
    setMatchesDialogVisible(true); 
    setMatchesDialogData(rowData.matchList);
    let header = breadCrumbsItems[0].label; //season
    breadCrumbsItems.slice(1,-1).forEach((elem) => {header += " - " + elem.label.replace(":","")}); //filtros (sin el :)
    header += " - " + breadCrumbsItems[breadCrumbsItems.length-1].label.replace("By ",""); //groupBy
    header += " " + rowData[currentGroupBy.key]; //groupBy value
    setMatchesDialogHeader(header);
  }

  const matchesDialogHide = () => {
    setMatchesDialogVisible(false); 
    setMatchesDialogData([]);
    setMatchesDialogHeader("");
  }

  const total_team = (num, team_num, isK) => { //devuelve texto: num y porcentaje con formato + % y () (tiene en cuenta los k)
    let porc = team_num===0 ? 0 : num/team_num;
    return formatNumber(num, false, isK) + " (" + formatNumber(porc, true) + ")";
  }

  const formatNumber = (data, isPorc, isK) => { //devuelve texto
    let digits = 2;
    if (isPorc) data = data * 100;
    if (isK && data>=1000) {
      data = data / 1000;
      digits = 1;
    }
    let numF = Intl.NumberFormat("es-AR", {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(data);
    if (isPorc) numF += "%";
    if (digits===1) numF += "k"; //isK && data>=1000
    return numF;
  }

  const formatVersion = (rawVersion) => {
    let rawVersionSplit = rawVersion.split(".");
    return (rawVersionSplit[0]+"."+rawVersionSplit[1]+".1");
  }

  const buildCM = () => {
    let items = [];
    if (opOption === 2) //si es de seasons de BC
      items = seasons.map((season) => {return {label: season.label, command: () => processRawData(currentGroupBy, currentFilters, season)}})
    else { //si es de tabla o de groupBy de BC
      let filterKeys = currentFilters.map((filter) => filter.key);
      filterKeys.push(currentGroupBy.key);
      items = groupByOptions
        .filter((elem) => !filterKeys.includes(elem.key))
        .map((option) => {return{label:option.label, command: () => {
          let currentFilterElem = currentFilters;
          if (opOption === 0) //si es de tabla
            currentFilterElem.push({key: currentGroupBy.key, label: currentGroupBy.label, value: selected});
          processRawData({key: option.key, label: option.label}, currentFilterElem);
        }}})
    }
    return (<ContextMenu ref={cm} model={items}/>)
  }

  const processRawData = (groupBy, filters, season, raw) => { //season viene el objeto, viene solo al cambiarlo (en los procesados comunes, no); raw sólo viene en la primera carga (por sincronismo)
    if (!season) season=seasons[currentSeason]; else setCurrentSeason(season.id);
    if (!raw) raw=rawData; else setRawData(raw);
    setCurrentGroupBy(groupBy);
    setCurrentFilters(filters);
    cm.current.hide();

    buildBreadCrumb(groupBy, filters, season);
    let rawFiltered = applyFilters(filters, season, raw);
    process(groupBy, rawFiltered);
  }

  const buildBreadCrumb = (groupBy, filters, season) => {
    let currentBreadCrumbsItems = [];
    let CBCseasonItem = {label: season.label, command: (event) => select(event.originalEvent, 2)};
    currentBreadCrumbsItems.push(CBCseasonItem);
    if (filters.length !== 0) {
      filters.forEach((filter, pos) => {
        let CBCitem = {label: filter.label+": "+filter.value, command: () => {
          processRawData({key: filters[pos].key, label: filters[pos].label}, filters.slice(0, pos), season)
        }}
        currentBreadCrumbsItems.push(CBCitem);
      });
    }
    let CBCgroupByItem = {label: "By "+groupBy.label, command: (event) => select(event.originalEvent, 1)}
    currentBreadCrumbsItems.push(CBCgroupByItem);
    setBreadCrumbsItems(currentBreadCrumbsItems);
  }

  const applyFilters = (filters, season, raw) => {
    let rawFiltered = raw.filter((elem) => elem.gameStartTimestamp>=season.from && elem.gameStartTimestamp<season.to);
    filters.forEach((filter) => {
      rawFiltered = rawFiltered.filter((elem) => elem[filter.key]===filter.value);
    });
    return rawFiltered;
  }

  const process = (groupBy, rawFiltered) => {
    const dataKeys = [
      "gameDuration",
      "kills", "deaths", "assists",
      "goldEarned",
      "magicDamageDealtToChampions", "physicalDamageDealtToChampions", "trueDamageDealtToChampions",
      "timeCCingOthers",
      "totalDamageDealtToChampions", "totalDamageTaken", "totalHeal", "damageSelfMitigated", 
      "totalMinionsKilled", "neutralMinionsKilled",
      "visionScore",
      "firstBloodKill",
      "team_kills", "team_deaths", "team_assists", "team_totalDamageDealtToChampions", "team_totalDamageTaken", 
      "team_goldEarned", "team_dragonKills", "team_baronKills", "team_turretKills",
      "wardsPlaced", "controlWardsPlaced", "wardsKilled", 
      "turretsLost", 
      "skillshotsDodged", "skillshotsHit", 
      "soloKills", 
      "laneMinionsFirst10Minutes", "jungleCsBefore10Minutes",
      "win" //vienen en boolean -> se traduce solo
    ];
    //agrupo + proceso (sumas):
    let processed = {};
    rawFiltered.forEach((elem) => {
      if (elem[groupBy.key] in processed) {
        dataKeys.forEach((key) => {processed[elem[groupBy.key]][key] += (elem[key] ? elem[key] : 0)});
        processed[elem[groupBy.key]].games++;
        processed[elem[groupBy.key]].matchList.push(elem);
      } else {
        let mapEach = {};
        mapEach[groupBy.key] = elem[groupBy.key];
        dataKeys.forEach((key) => {mapEach[key] = (elem[key] ? elem[key] : 0)});
        mapEach.games = 1;
        mapEach.matchList = [elem];
        mapEach.gameVersion = formatVersion(elem.gameVersion);
        processed[elem[groupBy.key]] = mapEach;
      }
    });
    //promedios:
    Object.keys(processed).forEach((elem) => {
      dataKeys.forEach((key) => {processed[elem][key] /= processed[elem]["games"]})
    });
    setCalculatedData(Object.values(processed));
  }

  return (
    <div className="App">
      <div className='grid m-0'>
        <BreadCrumb className='col-11' style={{borderBottomRightRadius: "0", WebkitBorderTopRightRadius: "0"}} model={breadCrumbsItems} home={home}/>
        <div className='col-1 p-breadcrumb' style={{borderBottomLeftRadius: "0", WebkitBorderTopLeftRadius: "0"}}>
          <Button className='p-0 mr-1' onClick={() => {}} tooltip="Undo" tooltipOptions={{ position: 'bottom', mouseTrack: true, style: {width: "63px"} }}>
            <i className="pi pi-undo" style={{ fontSize: '0.8rem', padding: '0.2rem' }} />
          </Button>
          <Button className='p-0 mr-1' onClick={() => dt.current.exportCSV(false)} tooltip="Download" tooltipOptions={{ position: 'bottom', mouseTrack: true, style: {width: "97px"} }}>
            <i className="pi pi-file-excel" style={{ fontSize: '0.8rem', padding: '0.2rem' }} />
          </Button>
          <Button className='p-0' onClick={() => setColumnsDialogVisible(true)} tooltip="Config" tooltipOptions={{ position: 'bottom', mouseTrack: true, style: {width: "71px"} }}>
            <i className="pi pi-cog" style={{ fontSize: '0.8rem', padding: '0.2rem' }} />
          </Button>
        </div>
      </div>
      {buildCM()}
      <DataTable ref={dt} value={calculatedData} tableStyle={{ minWidth: '50rem' }} selectionMode="single" sortField="games" sortOrder={-1} scrollable scrollHeight={windowDimensions.height * 0.9}/*onRowClick={(event) => select(event, 0)}*/>
        {currentGroupBy.key==="championName" ? <Column body={(rowData) => <img src={`https://ddragon.leagueoflegends.com/cdn/${rowData.gameVersion}/img/champion/${rowData.championName}.png`} alt={rowData.championName} width="32px"/>}/> : undefined /*sino: currentGroupBy.key==="championName" && <Column body={(rd) => <img src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${rd.championName}.png`} alt={rd.championName} width="48px" />*/}
        <Column field={currentGroupBy.key} header={currentGroupBy.label} sortable/>
        {visibleColumns.map((c) => c.column)}
        <Column style={{minWidth: "110px"}} body={(rowData) => <div className="inline">
          <Button rounded outlined style={{width: "32px", height: "32px"}} icon="pi pi-filter" onClick={(event) => select(event, 0, rowData)} tooltip="Filter" tooltipOptions={{ position: 'bottom', mouseTrack: true, style: {width: "59px"} }}/>
          <Button rounded outlined style={{width: "32px", height: "32px"}} icon="pi pi-search" className="ml-2" onClick={() => matchesDialogShow(rowData)} tooltip="Details" tooltipOptions={{ position: 'bottom', mouseTrack: true, style: {width: "72px"} }}/>
        </div>}/>
      </DataTable>
      <MatchDetailsDialog
        header={matchesDialogHeader}
        visible={matchesDialogVisible}
        data={matchesDialogData}
        onHide={matchesDialogHide}
        formatNumber={formatNumber}
        formatVersion={formatVersion}
        windowDimensions={windowDimensions}
      />
      <ColumnSelectionDialog 
        visible={columnsDialogVisible} 
        setVisible={setColumnsDialogVisible} 
        hiddenColumns={hiddenColumns}
        setHiddenColumns={setHiddenColumns}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
      />
    </div>
  );
}

export default App;

/*
  rawData:
  [{A1}, {A2}, ..., {B1}, {B2}, ...]

  => filtra

  processed: (sum o el agrupado que sea)
  {
    sum1: {A},
    sum2: {B},
    ...
  }

  para la tabla (calculatedData):
    [{A}, {B}, ...]

  currentFilters:
    [{  key: filter1,
      label: filter1Label,
      value: filter1Value}, ...]

  currentGroupBy:
    {   key: groupBy1,
      label: groupBy1Label}

  seasons:
    [{"label": season1Label, "from": season1From, "to": season1To, "default": true}, ...] //default uno sólo, en el useEffect se agrega un id incremental de la posición
  
  currentSeason: índice de seasons

  opOption:
    0 común de tabla, 1 de groupBy en BC, 2 de season en BC 

  */

  //TODO undo
  //TODO csv (ver)
  //TODO tooltip (ver)
