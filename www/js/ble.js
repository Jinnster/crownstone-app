var BLEHandler = function() {
	var self = this;
	var addressKey = 'address';
	var flowerUuid = '39e1fa00-84a8-11e2-afba-0002a5d5c51b'; // not yet used
	var memoUuid = '1802';
	var alertLevelServiceUuid = '1802';
	var alertLevelCharacteristicUuid = '2a06';

	var linkLossServiceUuid = '1803';
	var linkLossCharacteristicUuid = '2a06';

	// crownstone
	//var crownstoneServiceUuid = '1802'

	var crownstoneServiceUuid = '2220';
	var crownstoneServiceFullUuid = '00002220-0000-1000-8000-00805f9b34fb';
	//var crownstoneServiceUuid = '00002220-0000-1000-8000-00805f9b34fb'
	//var crownstoneCharacteristicUuid = '00000124-0000-1000-8000-00805f9b34fb'
	var rssiUuid = '2201';
	var deviceTypeUuid = '0101';
	var roomUuid = '0102';
	var personalThresholdUuid = '0122';

	//////////////////////////////////////////////////////////////////////////////
	// Indoor Localisation Service
	var indoorLocalisationServiceUuid = '00002220-0000-1000-8000-00805f9b34fb';
	// Indoor Localisation Service - Characteristics
	var deviceScanUuid = '0123';
	var deviceListUuid = '0120';
	//////////////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////////////
	// Temperature Service
	var temperatureServiceUuid = 'f5f93100-59f9-11e4-aa15-123b93f75cba';
	// Temperature Service - Characteristics
	var temperatureCharacteristicUuid = 'f5f90001-59f9-11e4-aa15-123b93f75cba';
	//////////////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////////////
	// Power Service
	var powerServiceUuid = '5b8d7800-6f20-11e4-b116-123b93f75cba';
	// Power Service - Characteristics
	var pwmUuid = '5b8d0001-6f20-11e4-b116-123b93f75cba';
	var voltageCurveUuid = '5b8d0002-6f20-11e4-b116-123b93f75cba';
	var powerConsumptionUuid = '5b8d0003-6f20-11e4-b116-123b93f75cba';
	var currentLimitUuid = '5b8d0004-6f20-11e4-b116-123b93f75cba';
	//////////////////////////////////////////////////////////////////////////////

	var scanTimer = null;
	var connectTimer = null;
	var reconnectTimer = null;

	var iOSPlatform = "iOS";
	var androidPlatform = "Android";

	self.init = function() {
		console.log("Initializing connection");
		bluetoothle.initialize(self.initSuccess, self.initError, {"request": true});
	}

	self.connectDevice = function(address) {
		console.log("Beginning to connect to " + address + " with 5 second timeout");
		var paramsObj = {"address": address};
		bluetoothle.connect(self.connectSuccess, self.connectError, paramsObj);
		self.connectTimer = setTimeout(self.connectTimeout, 5000);
	}

	self.connectSuccess = function(obj) {
		if (obj.status == "connected") {
			console.log("Connected to: " + obj.name + " - " + obj.address);

			self.clearConnectTimeout();

			if (window.device.platform == androidPlatform) {
				console.log("Beginning discovery");
				bluetoothle.discover(self.discoverSuccess, self.discoverError);
			}

		//	self.tempDisconnectDevice();
		}
		else if (obj.status == "connecting") {
			console.log("Connecting to: " + obj.name + " - " + obj.address);
		}
		else {
			console.log("Unexpected connect status: " + obj.status);
			self.clearConnectTimeout();
		}
	}

	self.connectError = function(obj) {
		console.log("Connect error: " + obj.error + " - " + obj.message);
		self.clearConnectTimeout();
	}

	self.connectTimeout = function() {
		console.log('Connection timed out, stop connection attempts');
	}

	self.clearConnectTimeout = function() { 
		console.log("Clearing connect timeout");
		if (self.connectTimer != null) {
			clearTimeout(self.connectTimer);
		}
	}


	self.tempDisconnectDevice = function() {
		console.log("Disconnecting from device to test reconnect");
		bluetoothle.disconnect(self.tempDisconnectSuccess, self.tempDisconnectError);
	}

	self.tempDisconnectSuccess = function(obj) {
		if (obj.status == "disconnected") {
			console.log("Temp disconnect device and reconnecting in 1 second. Instantly reconnecting can cause issues");
			setTimeout(self.reconnect, 1000);
		} else if (obj.status == "disconnecting") {
			console.log("Temp disconnecting device");
		} else {
			console.log("Unexpected temp disconnect status: " + obj.status);
		}
	}

	self.tempDisconnectError = function(obj) {
		console.log("Temp disconnect error: " + obj.error + " - " + obj.message);
	}

	self.reconnect = function() {
		console.log("Reconnecting with 5 second timeout");
		bluetoothle.reconnect(self.reconnectSuccess, self.reconnectError);
		self.reconnectTimer = setTimeout(self.reconnectTimeout, 5000);
	}

	self.reconnectSuccess = function(obj) {
		if (obj.status == "connected") {
			console.log("Reconnected to: " + obj.name + " - " + obj.address);

			self.clearReconnectTimeout();

			if (window.device.platform == iOSPlatform) {
				console.log("Discovering alert level service");
				var paramsObj = {"serviceUuids": [alertLevelServiceUuid] };
				bluetoothle.services(self.alertLevelSuccess, self.alertLevelError, paramsObj);
			} else if (window.device.platform == androidPlatform) {
				console.log("Beginning discovery");
				bluetoothle.discover(self.discoverSuccess, self.discoverError);
			}
		} else if (obj.status == "connecting") {
			console.log("Reconnecting to : " + obj.name + " - " + obj.address);
		} else {
			console.log("Unexpected reconnect status: " + obj.status);
			self.disconnectDevice();
		}
	}

	self.reconnectError = function(obj) {
		console.log("Reconnect error: " + obj.error + " - " + obj.message);
		disconnectDevice();
	}

	self.reconnectTimeout = function() {
		console.log("Reconnection timed out");
	}

	self.clearReconnectTimeout = function() { 
		console.log("Clearing reconnect timeout");
		if (self.reconnectTimer != null) {
			clearTimeout(self.reconnectTimer);
		}
	}

	/**
	 * We now did scan for a device, and found one. Connect to this device. 
	 */
	self.startScanSuccess = function(obj) {
		if (obj.status == 'scanResult') {
			console.log('We got a result! Stop the scan and connect!');
			bluetoothle.stopScan(self.stopScanSuccess, self.stopScanError);
			self.clearScanTimeout();
			window.localStorage.setItem(addressKey, obj.address);
			self.connectDevice(obj.address);
		} else if (obj.status == 'scanStarted') {
			console.log('Scan was started successfully, stopping in 10 seconds');
			self.scanTimer = setTimeout(self.scanTimeout, 10000);
		} else {
			console.log('Unexpected start scan status: ' + obj.status);
			console.log('Stopping scan');
			bluetoothle.stopScan(self.stopScanSuccess, self.stopScanError);
			self.clearScanTimeout();
		}
	}
			
	self.stopScan = function() {
		if (bluetoothle.isScanning()) {
			bluetoothle.stopScan(self.stopScanSuccess, self.stopScanError);
		}
	}

	self.clearScanTimeout = function() { 
		console.log('Clearing scanning timeout');
		if (self.scanTimer != null) 	{
			clearTimeout(self.scanTimer);
		}
	}

	self.scanTimeout = function() {
		console.log('Scanning timed out, stop scanning');
		bluetoothle.stopScan(self.stopScanSuccess, self.stopScanError);
	}

	self.stopScanSuccess = function(obj) {
		if (obj.status == 'scanStopped') {
			console.log('Scan was stopped successfully');
		} else {
			console.log('Unexpected stop scan status: ' + obj.status);
		}
	}

	self.stopScanError = function(obj) {
		console.log('Stop scan error: ' + obj.error + ' - ' + obj.message);
	}

	self.startScanError = function(obj) {
		console.log('Scan error', obj.status);
		navigator.notification.alert(
				'Could not find a device using Bluetooth scanning.',
				null,
				'Status',
				'Sorry!');
	}

	/**
	 * Initalization successful, now start scan if no address yet registered (with which we are already connected).
	 *
	 * We use as a parameter the service uuid of the thing we search for.
	 */
	self.initSuccess = function(obj) {
		console.log('Properly connected to BLE chip');
		console.log("Message " + JSON.stringify(obj));
		if (obj.status == 'enabled') {

			var address = window.localStorage.getItem(self.addressKey);
			if (address == null) {
				console.log('No address known, so start scan');
				//var paramsObj = { 'serviceUuids': [memoUuid]};
				var paramsObj = { 'serviceUuids': [crownstoneServiceUuid]};
				bluetoothle.startScan(self.startScanSuccess, self.startScanError, paramsObj);
			} else {
				console.log('Address already known, so connect directly to ', address);
			}
		}
	}

	self.initError = function(obj) {
		console.log('Connection to BLE chip failed');
		console.log('Message', obj.status);
		navigator.notification.alert(
				'Bluetooth is not turned on, or could not be turned on. Make sure your phone has a Bluetooth 4.+ (BLE) chip.',
				null,
				'BLE off?',
				'Sorry!');
	}

	self.alertLevelSuccess = function(obj) {
		if (obj.status == "discoveredServices")
		{
//			console.log("Discovered services");
			var serviceUuids = obj.serviceUuids;
			for (var i = 0; i < serviceUuids.length; i++) {
				var serviceUuid = serviceUuids[i];
//				console.log("Found service Uuid: " + serviceUuid);
				if (serviceUuid == self.alertLevelServiceUuid) {
					console.log("Finding alert level characteristics");
					var paramsObj = {"serviceUuid":alertLevelServiceUuid, "characteristicUuids":[alertLevelCharacteristicUuid]};
					bluetoothle.characteristics(self.characteristicsAlertLevelSuccess, self.characteristicsAlertLevelError, paramsObj);
					return;
				}
			}
			console.log("Error: alert level service not found");
//			return;
		}
		else
		{
			console.log("Unexpected services alert level status: " + obj.status);
		}
		self.disconnectDevice();
	}

	self.alertLevelError = function(obj) {
		console.log("Services alert level error: " + obj.error + " - " + obj.message);
		self.disconnectDevice();
	}

	self.characteristicsAlertLevelSuccess = function(obj) {
		if (obj.status == "discoveredCharacteristics") {
			var characteristicUuids = obj.characteristicUuids;
			for (var i = 0; i < characteristicUuids.length; i++)
			{
				console.log("Alert level characteristics found, now discovering descriptor");
				var characteristicUuid = characteristicUuids[i];

				if (characteristicUuid == alertLevelCharacteristicUuid) {
					//self.writeAlertLevel();
					self.readLinkLoss();
					return;
					//var paramsObj = {"serviceUuid": self.alertLevelServiceUuid, "characteristicUuid": self.alertLevelCharacteristicUuid};
					//bluetoothle.descriptors(self.descriptorsAlertLevelSuccess, self.descriptorsAlertLevelError, paramsObj);
					//return;
				}
			}
			console.log("Error: Alert level characteristic not found.");
		}
		else
		{
			console.log("Unexpected characteristics alert level: " + obj.status);
		}
		self.disconnectDevice();
	}

	self.characteristicsAlertLevelError = function(obj)
	{
		console.log("Characteristics heart error: " + obj.error + " - " + obj.message);
		self.disconnectDevice();
	}

	// function only works on iOS, not on Android
	self.descriptorsAlertLevelSuccess = function(obj)
	{
		if (obj.status == "discoveredDescriptors")
		{
			console.log("Discovered alert level descriptor");
		}
		else
		{
			console.log("Unexpected alert level status: " + obj.status);
			self.disconnectDevice();
		}
	}

	// function only works on iOS, not on Android
	self.descriptorsAlertLevelError = function(obj)
	{
		console.log("Descriptors alert error: " + obj.error + " - " + obj.message);
		self.disconnectDevice();
	}

	self.discoverSuccess = function(obj)
	{
		if (obj.status == "discovered")
		{
			console.log("Discovery completed");
			var services = obj.services;
			for (var i = 0; i < services.length; ++i) {
				var serviceUuid = services[i].serviceUuid;
				var characteristics = services[i].characteristics;
				for (var j = 0; j < characteristics.length; ++j) {
					var characteristicUuid = characteristics[j].characteristicUuid;
					console.log("Found service " + serviceUuid + " with characteristic " + characteristicUuid);
				}
			}
		}
		else
		{
			console.log("Unexpected discover status: " + obj.status);
			self.disconnectDevice();
		}
	}

	self.discoverError = function(obj)
	{
		console.log("Discover error: " + obj.error + " - " + obj.message);
		self.disconnectDevice();
	}

	// self.writePowerLevel = function() {
	// 	var u8 = new Uint8Array(1);
	// 	u8[0] = 2;
	// 	var v = bluetoothle.bytesToEncodedString(u8);
	// 	console.log("Write signal " + v + " at service " + crownstoneServiceUuid + ' and characteristic ' + crownstoneCharacteristicUuid);
	// 	var paramsObj = {"serviceUuid": crownstoneServiceUuid, "characteristicUuid": crownstoneCharacteristicUuid, "value": v };
	// 	bluetoothle.write(self.writeCrownstoneSuccess, self.writeCrownstoneError, paramsObj);
	// }

	// self.writeCrownstoneSuccess = function(obj) {
	// 	if (obj.status == 'written') {
	// 		console.log('Successful written power command', obj.status);
	// 	} else {
	// 		console.log('Writing was not successful', obj);
	// 	}
	// }

	// self.writeCrownstoneError = function(obj) {
	// 	console.log('Error in writing power command', obj.status);
	// }
	
	self.writeAlertLevel = function() {
		var u8 = new Uint8Array(1);
		u8[0] = 2;
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write alert level " + v + " at service " + alertLevelServiceUuid + ' and characteristic ' + alertLevelCharacteristicUuid);
		var paramsObj = {"serviceUuid": alertLevelServiceUuid, "characteristicUuid": alertLevelCharacteristicUuid, "value": v };
		bluetoothle.write(self.writeAlertLevelSuccess, self.writeAlertLevelError, paramsObj);
	}
	
	self.writeAlertLevelSuccess = function(obj) {
		if (obj.status == 'written') {
			console.log('Successful written alert level', obj.status);
		} else {
			console.log('Writing was not successful', obj);
		}
	}

	self.writeAlertLevelError = function(obj) {
		console.log('Error in writing alert level', obj.status);
	}

	self.readLinkLoss = function() {
		console.log("Read link loss level at service " + linkLossServiceUuid + ' and characteristic ' + linkLossCharacteristicUuid);
		var paramsObj = {"serviceUuid": linkLossServiceUuid, "characteristicUuid": linkLossCharacteristicUuid};
		bluetoothle.read(self.readLinkLossSuccess, self.readLinkLossError, paramsObj);
	}

	self.readLinkLossSuccess = function(obj) {
		if (obj.status == "read")
		{
			console.log("Read status");
			self.writeAlertLevel();

			//var bytes = bluetoothle.encodedStringToBytes(obj.value);
			//console.log("Link loss: " + bytes[0]);

			/*
			console.log("Subscribing to heart rate for 5 seconds");
			var paramsObj = {"serviceUuid":heartRateServiceUuid, "characteristicUuid":heartRateMeasurementCharacteristicUuid};
			bluetoothle.subscribe(subscribeSuccess, subscribeError, paramsObj);
			setTimeout(unsubscribeDevice, 5000);
			*/
		}
		else
		{
			console.log("Unexpected read status: " + obj.status);
			self.disconnectDevice();
		}
	}

	self.readLinkLossError = function(obj) {
		console.log('Error in reading link loss level', obj.status);
		self.writeAlertLevel();
	}

	self.readBatteryLevel = function() {
		console.log("Reading battery level, not yet implemented");
		//var paramsObj = {"serviceUuid":batteryServiceUuid, "characteristicUuid":batteryLevelCharacteristicUuid};
		//bluetoothle.read(readSuccess, readError, paramsObj);
	}

	self.readTemperature = function(callback) {
		console.log("Read temperature at service " + temperatureServiceUuid + ' and characteristic ' + temperatureCharacteristicUuid);
		var paramsObj = {"serviceUuid": temperatureServiceUuid, "characteristicUuid": temperatureCharacteristicUuid};
		bluetoothle.read(function(obj) {
			if (obj.status == "read")
			{
				var temperature = bluetoothle.encodedStringToBytes(obj.value);
				console.log("temperature: " + temperature[0]);

				callback(temperature[0]);
			}
			else
			{
				console.log("Unexpected read status: " + obj.status);
				self.disconnectDevice();
			}
		}, 
		function(obj) {
			console.log('Error in reading temperature: ' + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.scanDevices = function(scan) {
		var u8 = new Uint8Array(1);
		u8[0] = scan ? 1 : 0;
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + indoorLocalisationServiceUuid + ' and characteristic ' + deviceScanUuid );
		var paramsObj = {"serviceUuid": indoorLocalisationServiceUuid, "characteristicUuid": deviceScanUuid , "value" : v};
		bluetoothle.write(function(obj) {
			if (obj.status == 'written') {
				console.log('Successfully written to device scan characteristic - ' + obj.status);
			} else {
				console.log('Writing to device scan characteristic was not successful' + obj);
			}
		},
		function(obj) {
			console.log("Error in writing device scan characteristic" + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.listDevices = function(callback) {
		console.log("Read device list at service " + indoorLocalisationServiceUuid + ' and characteristic ' + deviceListUuid );
		var paramsObj = {"serviceUuid": indoorLocalisationServiceUuid, "characteristicUuid": deviceListUuid };
		bluetoothle.read(function(obj) {
			if (obj.status == "read")
			{
				var list = bluetoothle.encodedStringToBytes(obj.value);
				console.log("list: " + list[0]);

				callback(list);
			}
			else
			{
				console.log("Unexpected read status: " + obj.status);
				self.disconnectDevice();
			}
		}, 
		function(obj) {
			console.log('Error in reading temperature: ' + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.writePWM = function(value) {
		var u8 = new Uint8Array(1);
		u8[0] = value;
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + powerServiceUuid + ' and characteristic ' + pwmUuid );
		var paramsObj = {"serviceUuid": powerServiceUuid, "characteristicUuid": pwmUuid , "value" : v};
		bluetoothle.write(function(obj) {
			if (obj.status == 'written') {
				console.log('Successfully written to pwm characteristic - ' + obj.status);
			} else {
				console.log('Writing to pwm characteristic was not successful' + obj);
			}
		},
		function(obj) {
			console.log("Error in writing to pwm characteristic" + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.readPowerConsumption = function(callback) {
		console.log("Read power consumption at service " + powerServiceUuid + ' and characteristic ' + powerConsumptionUuid);
		var paramsObj = {"serviceUuid": powerServiceUuid, "characteristicUuid": powerConsumptionUuid};
		bluetoothle.read(function(obj) {
			if (obj.status == "read")
			{
				var powerConsumption = bluetoothle.encodedStringToBytes(obj.value);
				console.log("powerConsumption: " + powerConsumption[0]);

				callback(powerConsumption[0]);
			}
			else
			{
				console.log("Unexpected read status: " + obj.status);
				self.disconnectDevice();
			}
		}, 
		function(obj) {
			console.log('Error in reading temperature: ' + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.writeDeviceType = function(value) {
		var u8 = bluetoothle.stringToBytes(value);
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + crownstoneServiceUuid + ' and characteristic ' + deviceTypeUuid );
		var paramsObj = {"serviceUuid": crownstoneServiceUuid, "characteristicUuid": deviceTypeUuid , "value" : v};
		bluetoothle.write(function(obj) {
			if (obj.status == 'written') {
				console.log('Successfully written to device type characteristic - ' + obj.status);
			} else {
				console.log('Writing to device type characteristic was not successful' + obj);
			}
		},
		function(obj) {
			console.log("Error in writing to device type characteristic" + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.readDeviceType = function(callback) {
		console.log("Read device type at service " + crownstoneServiceUuid + ' and characteristic ' + deviceTypeUuid );
		var paramsObj = {"serviceUuid": crownstoneServiceUuid, "characteristicUuid": deviceTypeUuid };
		bluetoothle.read(function(obj) {
			if (obj.status == "read")
			{
				var deviceType = bluetoothle.encodedStringToBytes(obj.value);
				var deviceTypeStr = bluetoothle.bytesToString(deviceType);
				console.log("deviceType: " + deviceTypeStr);

				callback(deviceTypeStr);
			}
			else
			{
				console.log("Unexpected read status: " + obj.status);
				self.disconnectDevice();
			}
		}, 
		function(obj) {
			console.log('Error in reading device type characteristic: ' + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.writeRoom = function(value) {
		var u8 = bluetoothle.stringToBytes(value);
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + crownstoneServiceUuid + ' and characteristic ' + roomUuid );
		var paramsObj = {"serviceUuid": crownstoneServiceUuid, "characteristicUuid": roomUuid , "value" : v};
		bluetoothle.write(function(obj) {
			if (obj.status == 'written') {
				console.log('Successfully written to room characteristic - ' + obj.status);
			} else {
				console.log('Writing to room characteristic was not successful' + obj);
			}
		},
		function(obj) {
			console.log("Error in writing to room characteristic" + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.readRoom = function(callback) {
		console.log("Read room at service " + crownstoneServiceUuid + ' and characteristic ' + roomUuid );
		var paramsObj = {"serviceUuid": crownstoneServiceUuid, "characteristicUuid": roomUuid };
		bluetoothle.read(function(obj) {
			if (obj.status == "read")
			{
				var room = bluetoothle.encodedStringToBytes(obj.value);
				var roomStr = bluetoothle.bytesToString(room);
				console.log("room: " + roomStr);

				callback(roomStr);
			}
			else
			{
				console.log("Unexpected read status: " + obj.status);
				self.disconnectDevice();
			}
		}, 
		function(obj) {
			console.log('Error in reading room characteristic: ' + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.writeCurrentLimit = function(value) {
		var u8 = new Uint8Array(4);
		u8[0] = value & 0xFF;
		u8[1] = (value >> 8) & 0xFF;
		u8[2] = (value >> 16) & 0xFF;
		u8[3] = (value >> 24) & 0xFF;
		var v = bluetoothle.bytesToEncodedString(u8);
		console.log("Write " + v + " at service " + powerServiceUuid + ' and characteristic ' + currentLimitUuid );
		var paramsObj = {"serviceUuid": powerServiceUuid, "characteristicUuid": currentLimitUuid , "value" : v};
		bluetoothle.write(function(obj) {
			if (obj.status == 'written') {
				console.log('Successfully written to current limit characteristic - ' + obj.status);
			} else {
				console.log('Writing to current limit characteristic was not successful' + obj);
			}
		},
		function(obj) {
			console.log("Error in writing to current limit characteristic" + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.readCurrentLimit = function(callback) {
		console.log("Read current limit at service " + powerServiceUuid + ' and characteristic ' + currentLimitUuid );
		var paramsObj = {"serviceUuid": powerServiceUuid, "characteristicUuid": currentLimitUuid };
		bluetoothle.read(function(obj) {
			if (obj.status == "read")
			{
				var currentLimit = bluetoothle.encodedStringToBytes(obj.value);
				console.log("current limit: " + currentLimit[0] + '-' + currentLimit[1] + '-' + currentLimit[2] + '-' + currentLimit[3]);

				var value = (currentLimit[0] & 0xFF) | ((currentLimit[1] & 0xFF) << 8) | 
							((currentLimit[2] & 0xFF) << 16) | ((currentLimit[3] & 0xFF) << 24);

				callback(value);
			}
			else
			{
				console.log("Unexpected read status: " + obj.status);
				self.disconnectDevice();
			}
		}, 
		function(obj) {
			console.log('Error in reading current limit characteristic: ' + obj.error + " - " + obj.message);
		},
		paramsObj);
	}

	self.disconnectDevice = function() {
		bluetoothle.disconnect(self.disconnectSuccess, self.disconnectError);
	}

	self.disconnectSuccess = function(obj)
	{
		if (obj.status == "disconnected")
		{
			console.log("Disconnect device");
			self.closeDevice();
		}
		else if (obj.status == "disconnecting")
		{
			console.log("Disconnecting device");
		}
		else
		{
			console.log("Unexpected disconnect status: " + obj.status);
		}
	}

	self.disconnectError = function(obj)
	{
		console.log("Disconnect error: " + obj.error + " - " + obj.message);
	}

	self.closeDevice = function()
	{
		bluetoothle.close(self.closeSuccess, self.closeError);
	}

	self.closeSuccess = function(obj)
	{
		if (obj.status == "closed")
		{
			console.log("Closed device");
		}
		else
		{
			console.log("Unexpected close status: " + obj.status);
		}
	}

	self.closeError = function(obj)
	{
		console.log("Close error: " + obj.error + " - " + obj.message);
	}
}

