import React from 'react';
import { Dialog } from 'primereact/dialog';
import { PickList } from 'primereact/picklist';

const ColumnSelectionDialog = ({visible, setVisible, hiddenColumns, setHiddenColumns, visibleColumns, setVisibleColumns}) => { //otra forma: props y abajo al usarlo props.visible (por ej)

    const columnChange = (event) => {
        setVisibleColumns(event.source);
        setHiddenColumns(event.target);
    };

    return <Dialog header="Columns Configuration" visible={visible} onHide={()=>setVisible(false)} draggable={false} style={{width: "50%", height:"90%"}}>
        <PickList 
            dataKey="label" 
            itemTemplate={(c) => c.label} 
            source={visibleColumns} 
            target={hiddenColumns} 
            onChange={columnChange} 
            sourceHeader="Visible" 
            targetHeader="Hidden" 
            showTargetControls={false} 
            metaKeySelection={true}
        />
    </Dialog>;
}

export default ColumnSelectionDialog;