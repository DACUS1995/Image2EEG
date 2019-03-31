//@ts-check

const {ipcRenderer} = require('electron');
const remote = require('electron').remote;

const readChunk = require('read-chunk');
const fileType = require('file-type');
const $ = require('jquery');
const path = require("path");

const Config = require('electron-config');
const config = new Config();

let index = 0;

$(document).ready(() => {
	let messageElm = $("#message");
	let messageSpanElm = $("#message-span");

	messageElm.val(config.get('message'));
	messageSpanElm.html(config.get('message') || '  ');

	messageElm.on('input', (val) => {
		config.set('message', messageElm.val());
		messageSpanElm.html(config.get('message') || '  ');
  })
})

class Slideshow
{
	// TODO reFUCKtor needed
	constructor()
	{
		this._bIsRecording = false;
	}

	async run()
	{
		this.updateSlideshow();
	}

	updateSlideshow()
	{
		ipcRenderer.once('list_files_reply', (event, arrFiles) => {
			// index = (index + 1) % arrFiles.length; // Looping the slideshow
			index++;
	
			if(index === arrFiles.length)
			{
				return;
			}
	
			this.showAsset(arrFiles[index], () => {
				if(this._bIsRecording === true)
				{
					console.log("---> Stoping recording.");
					this.stopEEGRecording();
				}
				this.updateSlideshow();
			});
		});
	
		ipcRenderer.send('list_files');
	}
	
	static getFileType(file)
	{
		const buffer = readChunk.sync(file, 0, 262);
		return fileType(buffer);
	}
	
	static isImage(file)
	{
		try
		{
			return Slideshow.getFileType(file).mime.match(/^image\//);
		}
		catch(e)
		{
			return false;
		}
	}
	
	
	static isVideo(file)
	{
		try 
		{
			return Slideshow.getFileType(file).mime.match(/^video\//);
		} 
		catch(e)
		{
			return false
		}
	}

	/**
	 * @param {string} strFileName
	 */
	startEEGRecording(strFileName)
	{
		this._bIsRecording = true;
		ipcRenderer.send("startRecording", strFileName);
		// return new Promise((fnResolve, fnReject) => {
		// 	ipcRenderer.on("confirm_startRecording", fnResolve);
		// });
		return;
	}

	stopEEGRecording()
	{
		this._bIsRecording = false;
		ipcRenderer.send("stopRecording");
		// return new Promise((fnResolve, fnReject) => {
		// 	ipcRenderer.on("confirm_stopRecording", fnResolve);
		// });
		return;
	}
	
	showAsset(strFilePath, cb, nIntervalMiliSec = 5000)
	{
		if(this._bIsRecording === false)
		{
			const strFileName = strFilePath.split("\\").pop().split(".")[0] + ".csv";
			console.log(`---> Started recording for file: [${strFileName}]`);
			this.startEEGRecording(strFileName)
		}
		else
		{
			throw new Error("At this point EEG should not be recording.")
		}


		const elDivContent = $("#content");
	
		let windowAspect = window.outerWidth / window.outerHeight;
		elDivContent.html("");
		
		if(Slideshow.isImage(strFilePath))
		{
			console.log("Showing: ", strFilePath);
	
			let elm = $("<img>");
			// elm.addClass("fill-image")
			elm.attr("src", strFilePath);
			elDivContent.append(elm);
	
			setTimeout(cb, nIntervalMiliSec);
			return;
		}
		else if(Slideshow.isVideo(strFilePath))
		{
			console.log("video", strFilePath);
	
			let elm = $("<video>");
			elm.attr('autoplay', true);
			elm.attr('src', strFilePath);
			dom.append(elm);
	
			elm[0].onerror = cb;
			elm[0].addEventListener('loadedmetadata', () => {
				console.log("duration",elm[0].duration);
			});
	
			elm[0].addEventListener('ended', () => {
				cb();
			}, false);
		}
		else 
		{
			throw new Error(`Unsuported file type: ${Slideshow.getFileType(strFilePath)}`);
			cb();
		}
	}
}



new Slideshow().run()
	.catch(console.error);
