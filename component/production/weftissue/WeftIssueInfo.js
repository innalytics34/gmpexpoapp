import React, { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, TextInput as PaperInput, Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { colors, toastConfig } from '../../config/config';
import Loader from '../../loader/Loader';
import Dropdown from '../../dropdown/Dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFromAPI, postToAPI } from '../../../apicall/apicall';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import WeftIssueList from '../weftissue/WeftIssueList';
import { resetSavedData } from './savedDataSlice';
import { getCurrentWifiSignalStrength, CurrentWifiSignalStrength} from '../../checkNetworkStatus';



const WeftIssueInfo = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const qrData = useSelector(state => state.QRData.data);
  const savedData = useSelector((state) => state.savedData.items);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [docno] = useState('AutoNumber');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWODet, setSelectedWODet] = useState('');
  const [selectedItemNoDet, setSelectedItemDet] = useState('');
  const [selectedProductionLoc, setSelectedProductionLoc] = useState({"Description": "Production Loom Shed:01", "UID": 1007101, "_index": 0, "label": "Production Loom Shed:01", "value": 1007101});
  const [selectedLoomDet, setSelectedLoomDet] = useState('');
  const [getItemDescriptionDp, setItemDescriptionDp] = useState([]);
  const [getItemDescription, setItemDescription] = useState('');
  const [getProductionLocationDp, setProductionLocationDp] = useState([]);
  const [getProductionLocation, setProductionLocation] = useState(1007101);
  const [getWorkOrderNoDp, setWorkOrderNoDp] = useState([]);
  const [getWorkOrderNo, setWorkOrderNo] = useState('');
  const [getLoomNoDp, setLoomNoDp] = useState([]);
  const [getLoomNo, setLoomNo] = useState('');
  const [getRemarks, setRemarks] = useState('');
  const [getWifiSignal, setWifiSignal] = useState(0);
  const [ishideloomDp, setIshideloomDp] = useState(false);
  const [submitButtonEnable, setsubmitButtonEnable] = useState(false);

  useEffect(() => {
      const interval = setInterval(async () => {
        const signalresponse = await CurrentWifiSignalStrength();
        setWifiSignal(signalresponse);
      }, 2000);
      return () => clearInterval(interval);
    }, [])


    useEffect(() => {
      setLoading(true);
      if (Array.isArray(getLoomNoDp)) {
        if (qrData != null && getLoomNoDp.length > 0 && qrData.length < 7) {
          const result = getLoomNoDp.find(item => item.MachineNo === qrData);
          if (result) {
            setIshideloomDp(true);
            setLoomNo(result.value);
            handleLoomNoChange(result.value)
          } else {
            Toast.show({
              ...toastConfig.error,
              text1: 'QR Code Data not Found',
            });
            setIshideloomDp(false);
          }
        }
      }
      setLoading(false);
    }, [getLoomNo, qrData]);  

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Text style={{ color: colors.textLight, fontWeight: 'bold', fontSize: 16 }}>Weft Issue</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="wifi" size={20} color="#bfffcf" style={{ marginRight: 5 }} />
                    <Text style={{ color: '#f66d5e', fontWeight: 'bold', fontSize: 12, opacity: 1.5 }}>
                      {getWifiSignal} dBm
                    </Text>
                  </View>
                </View>
      ),
      headerStyle: { backgroundColor: colors.header },
    });
  }, [navigation, getWifiSignal]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [response, response1, response2] = await Promise.all([
        getFromAPI('/get_loomno_new?data=' + '{"weft_type" : 1}'),
        getFromAPI('/get_production_location'),
        getFromAPI('/get_work_order_no'),
      ]);
      setLoomNoDp(response.loomNo_New);
      setWorkOrderNoDp(response2.WorkOrderNo)
      setProductionLocationDp(response1.ProductionLocation);
    } catch (error) {
      Alert.alert('Error', 'Failed to load filter data. Logout and Try Again.');
      console.error('Error fetching filter data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setDate(date.toISOString().split('T')[0]);
      setSelectedDate(date);
    }
  };

  const handleItemChange = (selectedItem) => {
    setItemDescription(selectedItem);
    setErrors((prevErrors) => ({ ...prevErrors, descrip: '' }));
    const selectedData = getItemDescriptionDp.find(item => item.value === selectedItem);
    setSelectedItemDet(selectedData);
  };

  const handleWorkOrderNoChange = async (selectedItem) => {
    setWorkOrderNo(selectedItem);
  };

  const handleProductionLocation = (value) => {
    setProductionLocation(value);
    const selectedData = getProductionLocationDp.find(item => item.value === value);
    setSelectedProductionLoc(selectedData);
    setErrors((prevErrors) => ({ ...prevErrors, ProductionLocation: '' }));
  };

  const handleLoomNoChange = async(selectedItem) => {
    setLoomNo(selectedItem);
    const selectedData = getLoomNoDp.find(item => item.value === selectedItem);
    setSelectedLoomDet(selectedData);
    setWorkOrderNo(selectedData.WorkOrderID);
    const selectedData1 = getWorkOrderNoDp.find(item => item.value === selectedData.WorkOrderID);
    setSelectedWODet(selectedData1);

    const data = { WorkOrderID: selectedData.WorkOrderID};
    const encodedFilterData = encodeURIComponent(JSON.stringify(data));
    const [response] = await Promise.all([
      getFromAPI('/get_wi_item_description?data=' + encodedFilterData),
    ]);
    setItemDescriptionDp(response.ItemDescription);
    setItemDescription('');
    setErrors((prevErrors) => ({ ...prevErrors, loom_no: '' }));
    setErrors((prevErrors) => ({ ...prevErrors, WorkOrderNo: '' }));
  }

  // const navigateToCamera = () => {
  //   const newErrors = {};
  //   if (!docno) newErrors.docno = 'Document No is required';
  //   if (!date) newErrors.date = 'Date is required';
  //   if (!getWorkOrderNo) newErrors.WorkOrderNo = 'WorkOrder No is required';
  //   if (!getLoomNo) newErrors.loom_no = 'Loom No is required';
  //   if (!getItemDescription) newErrors.descrip = 'Item Description is required';
  //   if (!getProductionLocation) newErrors.ProductionLocation = 'Production Location is required';
  //   setErrors(newErrors);
  //   if (Object.keys(newErrors).length === 0) {
  //     navigation.navigate('Camera', {page : 'AddDoff'});
  //   };
  // }



  function checkIssueCone(data) {
    for (const item of data) {
      if (item.IssueCone === 0) {
        return false;
      }
    }
    return true;
  }

  const checkInput = () => {
    const newErrors = {};
    if (!docno) newErrors.docno = 'Document No is required';
    if (!date) newErrors.date = 'Date is required';
    if (!getWorkOrderNo) newErrors.WorkOrderNo = 'WorkOrder No is required';
    if (!getLoomNo) newErrors.loom_no = 'Loom No is required';
    if (!getItemDescription) newErrors.descrip = 'Item Description is required';
    if (!getProductionLocation) newErrors.ProductionLocation = 'Production Location is required';
    setErrors(newErrors);
    return newErrors
  }

  
  const navigateToCamera = () => {
    navigation.navigate('Camera', { page: 'DoffInfo' });
  }

  const loomWiseWeftReturnStockCheck = async()=>{
    const data = { workorder_id: selectedWODet.UID, loomid:selectedLoomDet.MachineID};
    const encodedFilterData = encodeURIComponent(JSON.stringify(data));
    const [response] = await Promise.all([
      getFromAPI('/LoomWiseWeftReturnStockCheck?data=' + encodedFilterData),
    ]);
    return response
  }


  const handleSubmit = async() => {
    const signalresponse = await getCurrentWifiSignalStrength();
        if (signalresponse.rval == 0){
          Toast.show({
            ...toastConfig.error,
            text1: signalresponse.message,
          });
          setButtonDisable(false);
         return;
        }

    const newErrors = {};
    if (!docno) newErrors.docno = 'Document No is required';
    if (!date) newErrors.date = 'Date is required';
    if (!getWorkOrderNo) newErrors.WorkOrderNo = 'WorkOrder No is required';
    if (!getLoomNo) newErrors.loom_no = 'Loom No is required';
    if (!getItemDescription) newErrors.descrip = 'Item Description is required';
    if (!getProductionLocation) newErrors.ProductionLocation = 'Production Location is required';
    // if (!getRemarks) newErrors.remarks = 'Remarks is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      if (savedData.length > 0){
        const output = checkIssueCone(savedData);
        const checkres = await loomWiseWeftReturnStockCheck();
        if (checkres == 1){
          Toast.show({
            ...toastConfig.error,
            text1: 'Please Close Weft Stock This LoomNo :' + selectedLoomDet.label,
          });
          return;
        }
        if (output){
          const data = { WIList: savedData,  docno, date,selectedWODet, WorkOrderNo:getWorkOrderNo,selectedItemNoDet,selectedLoomDet,selectedProductionLoc,
            LoomNo: getLoomNo, ItemDescription :getItemDescription,ProductionLocation:getProductionLocation, Remarks:getRemarks || ''
          }
            setsubmitButtonEnable(true);
            setLoading(true);
            const response = await postToAPI('/insert_weft_issue', data);
            setLoading(false);
            if (response.rval > 0){
              Toast.show({
                ...toastConfig.success,
                text1: response.message,
              });
              dispatch(resetSavedData());
              setTimeout(() => {
                navigation.navigate('Admin');
              }, 1500);
            }
            else{
              Toast.show({
                ...toastConfig.error,
                text1: response.message,
              });
            }
        }
        else{
          Toast.show({
            ...toastConfig.error,
            text1: 'Please Add IssueCone',
          });
        }
      }
      else{
        Toast.show({
          ...toastConfig.error,
          text1: 'Please Add Weft Issue List',
        });
      }
    }
  }

  return (
    <PaperProvider>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.row}>
          <PaperInput
            label="Document No"
            value={docno}
            style={[styles.input, { fontSize: 14 }]}
            error={!!errors.docno}
            mode="outlined"
            theme={{
              colors: {
                primary: colors.data,
                error: colors.error,
                outline: colors.data,
              },
              roundness: 4,
            }}
          />
          <PaperInput
            label="Date"
            value={date}
            style={[styles.input, { fontSize: 14 }]}
            error={!!errors.date}
            mode="outlined"
            theme={{
              colors: {
                primary: colors.data,
                error: colors.error,
                outline: colors.data,
              },
              roundness: 4,
            }}
            onFocus={() => setShowDatePicker(true)}
          />
        </View>

        <View style={styles.dp}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 320 }}>
                  <Dropdown
                    data={getLoomNoDp}
                    setSelectdp={handleLoomNoChange}
                    label="Loom No"
                    Selectdp={getLoomNo}
                    isDisable={ishideloomDp}
                  />
                </View>
                <View style={{
                  padding: 0, marginTop: 11
                }}>
                  <TouchableOpacity>
                    <Icon onPress={navigateToCamera} name="qr-code-outline" size={50} color={colors.header} />
                  </TouchableOpacity>
                </View>
              </View>
              {errors.loomNo ? <Text style={styles.errorText}>{errors.loomNo}</Text> : null}
            </View>

        <View style={styles.dp}>
          <Dropdown
            data={getWorkOrderNoDp}
            setSelectdp={handleWorkOrderNoChange}
            label="WorkOrder No"
            Selectdp={getWorkOrderNo}
            isDisable={true}
          />
          {errors.WorkOrderNo ? <Text style={styles.errorText}>{errors.WorkOrderNo}</Text> : null}
        </View>

        <View style={styles.dp}>
          <Dropdown
            data={getItemDescriptionDp}
            setSelectdp={handleItemChange}
            label="Item Description"
            Selectdp={getItemDescription}
          />
          {errors.descrip ? <Text style={styles.errorText}>{errors.descrip}</Text> : null}
        </View>
       
        <View style={styles.dp}>
          <Dropdown
            data={getProductionLocationDp}
            setSelectdp={handleProductionLocation}
            label="Production Location"
            Selectdp={getProductionLocation}
          />
          {errors.ProductionLocation && <Text style={styles.errorText}>{errors.ProductionLocation}</Text>}
        </View>

        <View style={styles.row}>
               <PaperInput
                        label="Remarks"
                        value={getRemarks}
                        style={[styles.input, { fontSize: 14 }]}
                        onChangeText={(text) => {
                          setRemarks(text);
                          setErrors((prevErrors) => ({ ...prevErrors, remarks: '' }));
                        }}
                        mode="outlined"
                        theme={{
                          colors: {
                            primary: colors.data,
                            error: colors.error,
                            outline: colors.data,
                          },
                          roundness: 4,
                        }}
                      />
        </View>
        {errors.remarks && <Text style={styles.errorText}>{errors.remarks}</Text>}

        {/* <View style={styles.row}>
          <PaperInput
            label="QR Data"
            value={qrData}
            style={[styles.input, { fontSize: 14 }]}
            mode="outlined"
            theme={{
              colors: {
                primary: colors.data,
                error: colors.error,
                outline: colors.data,
              },
              roundness: 4,
            }}
          />
          <View style={{
            padding: 0, marginTop: 4
          }}>
            <Icon onPress={navigateToCamera} name="qr-code-outline" size={55} color={colors.header} />
          </View>
        </View> */}

        <View>
          <WeftIssueList getItemDescription={getItemDescription} qrData={''} errors={errors}
           checkInput={checkInput} navigateToCamera={navigateToCamera} getProductionLocation={getProductionLocation}/>
        </View>

        <Button
          icon="content-save"
          mode="contained"
          style={{ backgroundColor: colors.button, marginBottom: 20, borderRadius: 10 }}
          disabled={submitButtonEnable}
          onPress={handleSubmit}
        >
          Save
        </Button>


        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        <Loader visible={loading} />
      </ScrollView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 10,
    backgroundColor: colors.background,
    marginTop: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    backgroundColor: 'red', // Optional background color
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginRight: 5,
    backgroundColor: colors.textLight,
  },
  errorText: {
    color: colors.error,
    marginBottom: 8,
    fontSize: 10,
  },
  dp: {
    marginBottom: 20,
  },
});

export default WeftIssueInfo;
