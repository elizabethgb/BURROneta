import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import ColumnSelectionDialog from './ColumnsSelectionDialog';

const MatchDetailsDialog = (props) => {

    const [columnsDialogVisible, setColumnsDialogVisible] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState([
        {label: "Champion", column: <Column key="champion" style={{minWidth: "76px"}} body={(rowData) => <div>
            <img src={`https://ddragon.leagueoflegends.com/cdn/${props.formatVersion(rowData.gameVersion)}/img/champion/${rowData.championName}.png`} alt={rowData.championName} width="32px"/>
            <span className='custom-badge'>{rowData.champLevel}</span>
        </div>}/>},
        {label: "Kill Score", column: <Column key="killScore" body={(rowData) => rowData.kills + "/" + rowData.deaths + "/" + rowData.assists}/>},
        {label: "KDA", column: <Column key="kda" field="kda" header="KDA" body={(rowData) => props.formatNumber((rowData.kills+rowData.assists)/(rowData.deaths?rowData.deaths:1))} sortable sortFunction={({data, order}) => data.sort((a, b) => (((a.deaths===0 ? a.kills+a.assists : (a.kills+a.assists)/a.deaths) - (b.deaths===0 ? b.kills+b.assists : (b.kills+b.assists)/b.deaths)) * order))}/>},
        {label: "KP", column: <Column key="kp" field="kp" header="KP" body={(rowData) => props.formatNumber((rowData.kills+rowData.assists)/(rowData.team_kills?rowData.team_kills:1), true)} sortable sortFunction={({data, order}) => data.sort((a, b) => (((a.team_kills===0 ? a.kills+a.assists : (a.kills+a.assists)/a.team_kills) - (b.team_kills===0 ? b.kills+b.assists : (b.kills+b.assists)/b.team_kills)) * order))}/>},
        {label: "Dmg Dealt", column: <Column key="totalDamageDealtToChampions" field="totalDamageDealtToChampions" header="Dmg Dealt" body={(rowData) => props.formatNumber(rowData.totalDamageDealtToChampions, false, true)} sortable/>},
        {label: "Dmg Taken", column: <Column key="totalDamageTaken" field="totalDamageTaken" header="Dmg Taken" body={(rowData) => props.formatNumber(rowData.totalDamageTaken, false, true)} sortable/>},
        {label: "Healed", column: <Column key="totalHeal" field="totalHeal" header="Healed" body={(rowData) => props.formatNumber(rowData.totalHeal, false, true)} sortable/>},
        {label: "Gold", column: <Column key="goldEarned" field="goldEarned" header="Gold" body={(rowData) => props.formatNumber(rowData.goldEarned, false, true)} sortable/>},
        {label: "CS", column: <Column key="cs" field="cs" header="CS" body={(rowData) => rowData.totalMinionsKilled + rowData.neutralMinionsKilled} sortable sortFunction={({data, order}) => data.sort((a, b) => (((a.totalMinionsKilled+a.neutralMinionsKilled) - (b.totalMinionsKilled+b.neutralMinionsKilled)) * order))}/>},
        {label: "Spells", column: <Column key="spells" style={{minWidth: "115px"}} body={(rowData) => buildSpells(rowData)}/>},
        {label: "Items", column: <Column key="items" style={{minWidth: "260px"}} body={(rowData) => buildItems(rowData)}/>},
        {label: "Duration", column: <Column key="gameDuration" field="gameDuration" header="Duration" body={(rowData) => formatTime(rowData.gameDuration)} sortable/>},
        {label: "Result", column: <Column key="result" field="result" header="Result" body={(rowData) => <Tag severity={rowData.win ? "success" : "danger"} value={rowData.result}/>} sortable/>},
        {label: "Date", column: <Column key="gameStartTimestamp" field="gameStartTimestamp" header="Date" body={(rowData) => formatDate(rowData.gameStartTimestamp)} sortable/>}
    ]);
    const [hiddenColumns, setHiddenColumns] = useState([]);

    const summonersList = {
      "1": {"id": "SummonerBoost", "name": "Cleanse", "key": "1"},
      "3": {"id": "SummonerExhaust", "name": "Exhaust", "key": "3"},
      "4": {"id": "SummonerFlash", "name": "Flash","key": "4"},
      "6": {"id": "SummonerHaste", "name": "Ghost", "key": "6"},
      "7": {"id": "SummonerHeal", "name": "Heal", "key": "7"},
      "11": {"id": "SummonerSmite", "name": "Smite", "key": "11"},
      "12": {"id": "SummonerTeleport", "name": "Teleport", "key": "12"},
      "13": {"id": "SummonerMana", "name": "Clarity", "key": "13"},
      "14": {"id": "SummonerDot", "name": "Ignite", "key": "14"},
      "21": {"id": "SummonerBarrier", "name": "Barrier", "key": "21"},
      "30": {"id": "SummonerPoroRecall", "name": "To the King!", "key": "30"},
      "31": {"id": "SummonerPoroThrow", "name": "Poro Toss", "key": "31"},
      "32": {"id": "SummonerSnowball", "name": "Mark", "key": "32"},
      "39": {"id": "SummonerSnowURFSnowball_Mark", "name": "Mark", "key": "39"},
      "54": {"id": "Summoner_UltBookPlaceholder", "name": "Placeholder", "key": "54"},
      "55": {"id": "Summoner_UltBookSmitePlaceholder", "name": "Placeholder and Attack-Smite", "key": "55"},
      "2201": {"id": "SummonerCherryHold", "name": "Flee", "key": "2201"},
      "2202": {"id": "SummonerCherryFlash", "name": "Flash", "key": "2202"}
    }
      
    const buildSpells = (rowData) => {
        let resp = [];
        for (let i=1; i<3; i++) {
            let summoner = summonersList[rowData["summoner" + i + "Id"]];
            if (summoner) {
                let im = <img key={"sumSpImg_"+i} src={`https://ddragon.leagueoflegends.com/cdn/${props.formatVersion(rowData.gameVersion)}/img/spell/${summoner.id}.png`} alt={summoner.name} width="32px"/>;
                resp.push(im);
            }
            let sp = <span key={"sumSpCst_"+i} className='custom-badge'>{rowData["summoner" + i + "Casts"]}</span>
            resp.push(sp);
        }
        return(<div>{resp}</div>);
    }
    
    const buildItems = (rowData) => {
        let resp = [];
        for (let i=0; i<7; i++) {
            let item = rowData["item" + i];
            let elem = item===0 ? <div key={"itemImg_"+i} className="inline-block" style={{width: "32px", height: "32px", minHeight: "32px"}} /> : <img key={"itemImg_"+i} src={`https://ddragon.leagueoflegends.com/cdn/${props.formatVersion(rowData.gameVersion)}/img/item/${item}.png`} alt={item} width="32px"/>;
            resp.push(elem);
        }
        return(<div>{resp}</div>);
    }

    const formatTime = (secs) => {
        let secsRest = secs % 60;
        let min = (secs - secsRest) / 60;
        return (min + ":" + (secsRest<10 ? "0"+secsRest : secsRest));
    }
    
    const formatDate = (ms) => {
        let date = new Date(ms);
        return(date.toLocaleString()); 
    }

    const getHeader = () => {
        return <div>
            <Button className='p-0 mr-2' onClick={() => setColumnsDialogVisible(true)} tooltip="Config" tooltipOptions={{ position: 'bottom', mouseTrack: true, style: {width: "71px"} }}>
                <i className="pi pi-cog" style={{ fontSize: '0.8rem', padding: '0.2rem' }}/>
            </Button>
            {props.header}
        </div>
    }

    return <div>
        <Dialog headerClassName="py-0" header={getHeader()} visible={props.visible} onHide={props.onHide} draggable={false} style={{minWidth: "95%", minHeight: "95%"}}>
            <DataTable value={props.data} selectionMode="single" sortField="gameStartTimestamp" sortOrder={-1} scrollable scrollHeight={props.windowDimensions.height * 0.79}>
                {visibleColumns.map((c) => c.column)}
            </DataTable>
        </Dialog>
        <ColumnSelectionDialog 
            visible={columnsDialogVisible} 
            setVisible={setColumnsDialogVisible} 
            hiddenColumns={hiddenColumns}
            setHiddenColumns={setHiddenColumns}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
        />
    </div>
}

export default MatchDetailsDialog; 