// QRCODE reader Copyright 2011 Lazar Laszlo
// http://www.webqr.com

var gCtx = null;
var gCanvas = null;
var c = 0;
var stype = 0;
var gUM = false;
var webkit = false;
var moz = false;
var v = null;

var imghtml = '<div id="qrfile"><canvas id="out-canvas" width="320" height="240"></canvas>' +
    '<div id="imghelp">drag and drop a QRCode here' +
    '<br>or select a file' +
    '<input type="file" onchange="handleFiles(this.files)"/>' +
    '</div>' +
    '</div>';

var vidhtml = '<video id="v" autoplay></video>';

function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
}

function drop(e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;
    if (files.length > 0) {
        handleFiles(files);
    } else
    if (dt.getData('URL')) {
        qrcode.decode(dt.getData('URL'));
    }
}

function handleFiles(f) {
    var o = [];

    for (var i = 0; i < f.length; i++) {
        var reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);

                qrcode.decode(e.target.result);
            };
        })(f[i]);
        reader.readAsDataURL(f[i]);
    }
}

function initCanvas(w, h) {
    gCanvas = document.getElementById("qr-canvas");
    gCanvas.style.width = w + "px";
    gCanvas.style.height = h + "px";
    gCanvas.width = w;
    gCanvas.height = h;
    gCtx = gCanvas.getContext("2d");
    gCtx.clearRect(0, 0, w, h);
}


function captureToCanvas() {
    if (stype != 1)
        return;
    if (gUM) {
        try {
            gCtx.drawImage(v, 0, 0);
            try {
                qrcode.decode();
            } catch (e) {
                console.log(e);
                setTimeout(captureToCanvas, 500);
            };
        } catch (e) {
            console.log(e);
            setTimeout(captureToCanvas, 500);
        };
    }
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shouldStop(newFloorNumber) {
    var storedStart = localStorage.getItem('stairTimingStart');
    if (!storedStart) {
        return false;
    }

    storedStart = JSON.parse(storedStart);
    var tooLong = (new Date().getTime() - storedStart.time) > (15 * 60 * 1000);
    if (tooLong) {
        return false;
    }

    if (storedStart.floor === newFloorNumber) {
        return false;
    }

    return true;
}

function startTiming(floor) {
    var start = {
        time: new Date().getTime(),
        floor: floor
    };
    localStorage.setItem('stairTimingStart', JSON.stringify(start));
    console.log('started timing. floor ' + floor);
}

function showLast() {
    alert(localStorage
        .getItem(lastCompleteRun));
}

function getUnsubmitted() {
    return Object.keys(localStorage).filter(function (key) {
        return /^unsubmitted-/.test(key);
    }).map(function (key) {
        var data = JSON.parse(localStorage.getItem(key));
        return {
            id: data.start.time,
            data: data,
            delete: localStorage.removeItem.bind(localStorage, key)
        };
    });
}

var currentlySubmitting = {};

function isCurrentlySubmitting(item) {
    return currentlySubmitting[item.id] !== undefined;
}

function getNextItemToTrySubmitting() {
    return getUnsubmitted().filter(function (item) {
        return !isCurrentlySubmitting(item)
    })[0];
}

function attemptToSubmitResults() {
    var nextItemToSubmit = getNextItemToTrySubmitting();
    if (!nextItemToSubmit) {
        return; //nothing to do
    }

    if (!navigator.onLine) {
        console.log('Cannot submit results right now - offline');
        alert('You appear to be offline. Try and find a signal and your result will be submitted when you are reconnected');
        return;
    }

    var resultToSubmit = nextItemToSubmit;
    console.log('attempting to submit a result for ' + resultToSubmit.data.start.floor + ' to ' + resultToSubmit.data.end.floor);
    currentlySubmitting[resultToSubmit.id] = resultToSubmit;
    $.ajax({
        type: "POST",
        url: '/activity/stairs',
        data: resultToSubmit.data,
        success: function () {
            delete currentlySubmitting[resultToSubmit.id];
            resultToSubmit.delete();
            alert('submitted result');

            attemptToSubmitResults(); //recurse to submit any next
        },
        error: function (err, textStatus) {
            console.log('error submitting result: ' + err);
            delete currentlySubmitting[resultToSubmit.id];
            if (navigator.onLine) {
                console.log('we seem to be online so trying again in 3 seconds...');
                setTimeout(attemptToSubmitResults, 3000); //backoff and try again
            }
        }
    });
}

if (navigator.onLine && getNextItemToTrySubmitting()) {
    alert('You seem to have ' + getUnsubmitted().length + ' results which have not been successfully submitted yet. These will be resubmitted now.');
    attemptToSubmitResults();
}

window.addEventListener('online', attemptToSubmitResults);

function stopTiming(floor) {
    console.log('stopped timing. floor ' + floor);
    var storedStart = localStorage.getItem('stairTimingStart');
    if (!storedStart) {
        throw new Error('not started yet');
    }
    var end = {
        time: new Date().getTime(),
        floor: floor
    };

    var complete = {
        start: JSON.parse(storedStart),
        end: end,
        meta: {
            onlineAtEnd: navigator.onLine
        }
    };

    localStorage.setItem('unsubmitted-' + JSON.parse(storedStart).time, JSON.stringify(complete));
    localStorage.removeItem('stairTimingStart');
    attemptToSubmitResults();
    return complete;
}

function submitTiming(climbDetails) {
    console.log('submitting timing');
    console.log(climbDetails);
    $.ajax({
        type: "POST",
        url: '/activity/stairs',
        data: climbDetails,
        success: function () {
            alert('submitted');
        },
        error: function () {
            setTimeout(submitTiming.bind(climbDetails), 3000);
        },
        dataType: 'json'
    });
}

if (window.location.hash.length > 0) {
    read(window.location);
}

var timeOfLastRead;

function read(qrCodeText) {
    // if (!timeOfLastRead) {
    //     timeOfLastRead = new Date().getTime();
    // }
    // if (((new Date().getTime() - timeOfLastRead) < 3000)) {
    //     return; //too soon
    // }
    // timeOfLastRead = new Date().getTime();

    var floorNumber = qrCodeText.split('#')[1];
    console.log('fn' + floorNumber)
    if (shouldStop(floorNumber)) {
        console.log('stopping...');
        var climbDetails = stopTiming(floorNumber);

        var duration = (climbDetails.end.time - climbDetails.start.time) / 1000 + ' seconds';
        var startFloor = climbDetails.start.floor;
        var endFloor = climbDetails.end.floor;

        renderResults(duration, startFloor, endFloor);
    } else {
        startTiming(floorNumber);
        alert('started');
    }
    //alert(a);
    // var html="<br>";
    // if(a.indexOf("http://") === 0 || a.indexOf("https://") === 0)
    //     html+="<a target='_blank' href='"+a+"'>"+a+"</a><br>";
    // html+="<b>"+htmlEntities(a)+"</b><br><br>";
    // document.getElementById("result").innerHTML=html;
    // startCapture(htmlEntities(a));
    // //startCapture(a);
}

function renderResults(time, startFloor, endFloor) {
    $('.scanner').hide();
    $('.results').addClass('active');
    $('.js-time').text(time);
    $('.js-startFloor').text(startFloor);
    $('.js-endFloor').text(endFloor);
}

function startCapture(a) {

    // window.location = a;
}

function isCanvasSupported() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
}

function success(stream) {
    if (webkit)
        v.src = window.webkitURL.createObjectURL(stream);
    else
    if (moz) {
        v.mozSrcObject = stream;
        v.play();
    } else
        v.src = stream;
    gUM = true;
    setTimeout(captureToCanvas, 500);
}

function error(error) {
    gUM = false;
    return;
}

function load() {
    if (isCanvasSupported() && window.File && window.FileReader) {
        initCanvas(800, 600);
        qrcode.callback = read;
        document.getElementById("main-body").style.display = "inline";
        setwebcam();
    } else {
        document.getElementById("main-body").style.display = "inline";
        document.getElementById("main-body").innerHTML = '<p id="mp1">QR code scanner for HTML5 capable browsers</p><br>' +
            '<br><p id="mp2">sorry your browser is not supported</p><br><br>' +
            '<p id="mp1">try <a href="http://www.mozilla.com/firefox"><img src="firefox.png"/></a> or <a href="http://chrome.google.com"><img src="chrome_logo.gif"/></a> or <a href="http://www.opera.com"><img src="Opera-logo.png"/></a></p>';
    }
}

function setwebcam() {
    document.getElementById("result").innerHTML = "- scanning -";
    if (stype == 1) {
        setTimeout(captureToCanvas, 500);
        return;
    }
    var n = navigator;
    document.getElementById("outdiv").innerHTML = vidhtml;
    v = document.getElementById("v");

    if (MediaStreamTrack && MediaStreamTrack.getSources) {
        MediaStreamTrack.getSources(function (sources) {
            var backVideo = sources.filter(function (source) {
                console.log(source);
                return source.kind === 'video' && source.facing === 'environment'
            });

            var constrains = {
                video: true,
                audio: false
            };
            console.log(backVideo);
            if (backVideo.length) {
                constrains.video = {
                    optional: [{
                        sourceId: backVideo[0].id
                    }]
                }
            };


            if (n.getUserMedia)
                n.getUserMedia(constrains, success, error);
            else if (n.webkitGetUserMedia) {
                webkit = true;
                n.webkitGetUserMedia(constrains, success, error);
            } else if (n.mozGetUserMedia) {
                moz = true;
                n.mozGetUserMedia(constrains, success, error);
            }

            //document.getElementById("qrimg").src="qrimg2.png";
            //document.getElementById("webcamimg").src="webcam.png";
            document.getElementById("qrimg").style.opacity = 0.2;
            document.getElementById("webcamimg").style.opacity = 1.0;

            stype = 1;
            setTimeout(captureToCanvas, 500);
        });
    } else {
        if (n.getUserMedia)
            n.getUserMedia({
                video: true,
                audio: false
            }, success, error);
        else
        if (n.webkitGetUserMedia) {
            webkit = true;
            n.webkitGetUserMedia({
                video: true,
                audio: false
            }, success, error);
        } else
        if (n.mozGetUserMedia) {
            moz = true;
            n.mozGetUserMedia({
                video: true,
                audio: false
            }, success, error);
        }

        //document.getElementById("qrimg").src="qrimg2.png";
        //document.getElementById("webcamimg").src="webcam.png";
        document.getElementById("qrimg").style.opacity = 0.2;
        document.getElementById("webcamimg").style.opacity = 1.0;

        stype = 1;
        setTimeout(captureToCanvas, 500);
    }

}

function setimg() {
    document.getElementById("result").innerHTML = "";
    if (stype == 2)
        return;
    document.getElementById("outdiv").innerHTML = imghtml;
    //document.getElementById("qrimg").src="qrimg.png";
    //document.getElementById("webcamimg").src="webcam2.png";
    document.getElementById("qrimg").style.opacity = 1.0;
    document.getElementById("webcamimg").style.opacity = 0.2;
    var qrfile = document.getElementById("qrfile");
    qrfile.addEventListener("dragenter", dragenter, false);
    qrfile.addEventListener("dragover", dragover, false);
    qrfile.addEventListener("drop", drop, false);
    stype = 2;
}
