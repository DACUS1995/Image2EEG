//@ts-check

const ws = require("ws");

class WebSocketClient
{
	constructor(strHost = "127.0.0.1", strPort = "54123")
	{
		this.strHost = strHost;
		this.strPort = strPort;

		this._socket = null;
		this._bConnected = false;
		this._uid = null;
		this._sign = null;

		this._bPrintIncomingData = false;
	}

	/**
	 * @returns Promise<bool>
	 */
	async connect()
	{
		if(this._bConnected && this._socket != null)
		{
			return;
		}

		this._socket = new ws(`ws://${this.strHost}:${this.strPort}`);
		const connectionPromise = new Promise((fnResove, fnReject) => {
			try
			{
				this._socket.on("open", () => {
					console.log("--> Connected to CyKIT WS Server.");

					this._bConnected = true;
					this._addMessageHandler(this._socket);
					fnResove(this._socket);
				});
			}
			catch(error)
			{
				fnReject(error.stack);
			}
		});

		return connectionPromise;
	}


	async _addCyKITConnectionInfo(data)
	{
		data = data.split(WebSocketClient.SPLIT_TOKEN);

		this._uid = data[0];
		this._sign = data[1];
		
		let text = data[2];
		let command = text.substring(0,10);

		if (command == "CyKITv2:::")
		{
			// this.onCommand(text);
			return;
		}
		
		if (text != 'SETUID') 
		{  
			// this.onData(text);
		}
		else 
		{
			// this.onRegist();
		}
	}


	async _addMessageHandler(wsHandler)
	{
		wsHandler.on("message", (data) => {
			if(this._bPrintIncomingData)
			{
				console.log("[" + data + "]");
			}

			if(this._uid == null && this._sign == null)
			{
				this._addCyKITConnectionInfo(data);
			}
		});


	}

	async sendData(textData) 
	{
		if (this._socket == null)
		{ 
			console.log("Cannot send data because the socket handler is null.");
			return;
		}

		if (this._socket.readyState != 1) 
		{
			console.log("Cannot send data because the socket handler is not ready.");
			return;
		}
		
		const data = this._uid + WebSocketClient.SPLIT_TOKEN + this._sign + WebSocketClient.SPLIT_TOKEN + textData;
		this._socket.send(data);
	}


	static get SPLIT_TOKEN(){return "<split>";}
}

module.exports = WebSocketClient;
