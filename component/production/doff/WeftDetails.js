import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { DataTable } from 'react-native-paper';
import { colors } from '../../config/config';
import { getFromAPI } from '../../../apicall/apicall';

const WeftDetails = ({ getWeftDetails, selectedLoomNoDet, setischeckweftcount, doffMeter  }) => {
  const [weftCounts, setWeftCounts] = useState({});

  const getweftCount = async (item) => {
    const data = { MachineId: selectedLoomNoDet.MachineID, 
      ItemUID: item.Item_UID, LotNo : item.LotNo, 
      loomUID:  selectedLoomNoDet.UID,
       WorkOrderID:  selectedLoomNoDet.WorkOrderID,
        doffMeter: doffMeter, WeightPerMeter: item.WeightPerMeter };
    const encodedFilterData = encodeURIComponent(JSON.stringify(data));
    const response = await getFromAPI('/actual_count_check?data=' + encodedFilterData);
    if (response.count == 0){
      setischeckweftcount(true);
    }
    else{
      setischeckweftcount(false);
    }
    return { count: response.count || 0, stock_val: response.stock_val };
  };

  useEffect(() => {
    const fetchWeftCounts = async () => {
      const counts = {};
      for (const item of getWeftDetails) {
        const { count, stock_val } = await getweftCount(item);  
        counts[item.Item_UID] = count;  
      }
      setWeftCounts(counts);
    };

    if (getWeftDetails.length > 0) {
      fetchWeftCounts();
    }
  }, [getWeftDetails, selectedLoomNoDet]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weft Details</Text>
      <DataTable style={styles.table}>
        <DataTable.Header>
          <DataTable.Title style={styles.header}>Item Desc</DataTable.Title>
          <DataTable.Title style={styles.header}>Actual Count</DataTable.Title>
          <DataTable.Title style={styles.header}>Weight Per Mtr</DataTable.Title>
        </DataTable.Header>

        <FlatList
          data={getWeftDetails}
          keyExtractor={(item) => item.Item_UID.toString()}
          renderItem={({ item }) => (
            <DataTable.Row style={styles.row}>
              <DataTable.Cell style={styles.cell}>
                <Text style={styles.cellText}>{item.ItemDescription}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.cell}>
                <Text style={styles.cellText}>
                  {weftCounts[item.Item_UID] !== undefined
                    ? weftCounts[item.Item_UID]
                    : '0'}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.cell}>
                <Text style={styles.cellText}>{item.WeightPerMeter}</Text>
              </DataTable.Cell>
            </DataTable.Row>
          )}
        />
      </DataTable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    color: 'gray',
  },
  table: {
    borderWidth: 1,
    borderColor: colors.data,
    borderRadius: 4,
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: 0.1,
    paddingHorizontal: 1,
  },
  row: {
    borderBottomWidth: 0.4,
    borderColor: colors.data,
  },
  cell: {
    paddingVertical: 16,
    paddingHorizontal: 1,
    flex: 1,
    justifyContent: 'left',
  },
  cellText: {
    flexWrap: 'wrap',
    maxWidth: '100%',
    fontSize: 10,
  },
});

export default WeftDetails;
