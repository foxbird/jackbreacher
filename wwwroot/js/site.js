
// Camera height/width
var camWidth = 1920;
var camHeight = 1080;

// Matrix and sequence values (make sure this matches the HTML)
var MAX_MATRIX_COLS = 6;
var MAX_MATRIX_ROWS = 6;
var MAX_SEQUENCE_COLS = 4;
var MAX_SEQUENCE_ROWS = 4;

// Maximum number of characters in a cell
var MAX_CELL_VALUE = 2;

// Valid values for the matrix (and sequence)
var VALID_CELLS = ["BD", "1C", "E9", "55", "7A", "FF"];

var camStreaming = false;
var camVideo = null;
var picCanvas = null;
var camPhoto = null;
var camStart = null;
var camCapture = null;
var camChooser = null;
var camStream = null;
var picCroppie = null;
var picSubmit = null;
var matrixSubmit = null;
var matrixClear = null;
var solBox = null;

var defaultDeviceId = localStorage.getItem("defaultDeviceId");
var defaultBufferSize = localStorage.getItem("defaultBufferSize");

if (defaultBufferSize == null || defaultBufferSize == "")
    defaultBufferSize = "4";

var LETTERS = "abcdefghijklmnopqrstuvwxyz";

function initCapture() {
    camVideo = document.getElementById('camVideo');
    camPhoto = document.getElementById('camPhoto');
    camStart = document.getElementById('camStart');
    camCapture = document.getElementById('camCapture');
    camChooser = document.getElementById('camChooser');
    picCanvas = document.getElementById('picCanvas');
    picPhoto = document.getElementById('picPhoto');
    picSubmit = document.getElementById('picSubmit');
    matrixSubmit = document.getElementById('matrixSubmit');
    matrixClear = document.getElementById('matrixClear');
    solBox = document.getElementById('solution');

    picCroppie = $(picPhoto).croppie({ viewport: { width: 250, height: 250, type: 'square' } });

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log("Could not enumerate camera devices");
        return;
    }

    // Trigger a get user media to make the browser ask for camera permissions first
    navigator.mediaDevices.getUserMedia({ audio: false, video: { width: 1920, height: 1080, facingMode: "environment" } }).then(function (stream) {

        // Stop the tracks and find the device ID for the default camera based on the above
        var tracks = stream.getTracks();
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].stop();
            if (defaultDeviceId != null || defaultDeviceId == "")
                defaultDeviceId = tracks[i].getSettings().deviceId;
        }

        // Store the default for later user
        localStorage.setItem("defaultDeviceId", defaultDeviceId);

        // Now with permission, enumerate all the devices
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
            devices.forEach(function (device) {
                if (device.kind != "videoinput")
                    return;
                $(camChooser).append(new Option(device.label, device.deviceId, device.deviceId == defaultDeviceId));
            });
            $(camChooser).val(defaultDeviceId);
        });

        // Enable the start button
        $(camStart).prop('disabled', false);
    });

    // Clear the starting photo
    clearPhoto();

    // Restore the default buffer size
    $(document.getElementById("sequenceMemory")).val(defaultBufferSize);


    // Add handlers to the buttons
    $(camStart).click(startCapture);
    $(camCapture).click(captureImage);
    $(picSubmit).click(submitImage);
    $(matrixSubmit).click(submitMatrix);
    $(matrixClear).click(clearAll);

    // Add cell change handlers
    for (var row = 0; row < MAX_MATRIX_ROWS; row++) {
        for (var col = 0; col < MAX_MATRIX_COLS; col++) {
            var id = "matrix" + (row + 1) + LETTERS[col];
            var cell = document.getElementById(id);

            $(cell).on('input', cellUpdate);
            $(cell).on('focus', cellFocus);
        }
    }

    // Add sequence change handlers
    for (var row = 0; row < MAX_SEQUENCE_ROWS; row++) {
        for (var col = 0; col < MAX_SEQUENCE_COLS; col++) {
            var id = "sequence" + (row + 1) + LETTERS[col];
            var cell = document.getElementById(id);

            $(cell).on('input', sequenceUpdate);
            $(cell).on('focus', cellFocus);

        }
        var id = "sequence" + (row + 1) + "v";
        var cell = document.getElementById(id);
        $(cell).on('focus', cellFocus);
    }
}

function cellFocus(event) {
    $(event.target).select();
}

function clearAll() {
    for (var row = 0; row < MAX_SEQUENCE_ROWS; row++) {
        for (var col = 0; col < MAX_SEQUENCE_COLS; col++) {
            var id = "sequence" + (row + 1) + LETTERS[col];
            var cell = document.getElementById(id);
            $(cell).val("");
            $(cell).removeClass("cell-bad");
        }
        var id = "sequence" + (row + 1) + "v";
        var cell = document.getElementById(id);
        $(cell).val("");
    }

    for (var row = 0; row < MAX_MATRIX_ROWS; row++) {
        for (var col = 0; col < MAX_MATRIX_COLS; col++) {
            var id = "matrix" + (row + 1) + LETTERS[col];
            var cell = document.getElementById(id);
            $(cell).val("");
            $(cell).removeClass("cell-bad");
        }
    }
}

var changingCell = false;
function cellUpdate(event) {
    // Don't trigger updates if we're already updating
    if (changingCell)
        return;

    var cell = $(event.target);

    // Uppercase the cell
    changingCell = true;
    var val = cell.val();
    val = val.toUpperCase();
    cell.val(val);
    changingCell = false;

    // Apply color based on the value
    if (VALID_CELLS.indexOf(val) == -1 && val.length != 0) {
        cell.addClass("cell-bad");
    } else {
        cell.removeClass("cell-bad");
    }

    // Move to the next cell
    if (val.length == MAX_CELL_VALUE) {
        // Figure out which cell we're on
        var id = cell.attr('id').substring("matrix".length);
        var row = id.substring(0, 1);
        var colStr = id.substring(1, 2);
        var col = LETTERS.indexOf(colStr);

        // Go to the next column
        col++;

        // Check for increement and wrap
        if (col == MAX_MATRIX_COLS) {
            row++;
            col = 0;
        }

        // If we're out of bounds, do nothing
        if (row == MAX_MATRIX_ROWS + 1) {
            return;
        }

        // Otherwise, set focus
        id = "matrix" + row + LETTERS[col];
        $("#" + id).focus();
    }
}


var changingSequence = false;
function sequenceUpdate(event) {
    if (changingSequence)
        return;

    var cell = $(event.target);

    // Uppercase it
    changingSequence = true;
    var val = cell.val();
    val = val.toUpperCase();
    cell.val(val);
    changingSequence = false;

    // Apply color based on the value
    if (VALID_CELLS.indexOf(val) == -1 && val.length != 0) {
        cell.addClass("cell-bad");
    } else {
        cell.removeClass("cell-bad");
    }

    // Move on to the next cell if we're done with this one
    if (val.length == MAX_CELL_VALUE) {
        // Figure out which cell we're on
        var id = cell.attr('id').substring("sequence".length);
        var row = id.substring(0, 1);
        var colStr = id.substring(1, 2);
        var col = LETTERS.indexOf(colStr);

        // Go to the next column
        col++;

        // Check for increement and wrap
        if (col == MAX_SEQUENCE_COLS) {
            row++;
            col = 0;
        }

        // If we're out of bounds, do nothing
        if (row == MAX_SEQUENCE_ROWS + 1) {
            return;
        }

        // Otherwise, set focus
        id = "sequence" + row + LETTERS[col];
        $("#" + id).focus();
    }
}

function startCapture() {
    // Figure out which camera was chosen and store it for later
    var deviceId = $(camChooser).val();
    localStorage.setItem("defaultDeviceId", deviceId);

    // Start the given camera
    navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId, width: 1920, height: 1080, facingMode: "environment" } }).then(function (stream) {
        camStream = stream;
        camVideo.srcObject = stream;
        camVideo.play();
    }).catch(function (err) {
        console.log("Error starting capture: " + err);
    });

    // When the video plays, activate the capture button, deactivate the start button
    $(camVideo).on('canplay', function () {
        $(camCapture).prop('disabled', false);
        $(camStart).prop('disabled', true);
        camWidth = camVideo.videoWidth;
        camHeight = camVideo.videoHeight;
    });
    clearPhoto();
}

function captureImage() {
    // Disable the capture button
    $(camCapture).prop('disabled', true);

    // Adjust the canvas to fit the camera images
    var ctx = picCanvas.getContext('2d');
    picCanvas.width = camWidth;
    picCanvas.height = camHeight;

    // Draw the video image onto the canvas
    ctx.drawImage(camVideo, 0, 0, camWidth, camHeight);

    // Stop the video/camera
    camStream.getTracks().forEach(function (track) {
        track.stop();
    });

    // Put the image into the img on the crop page
    var data = picCanvas.toDataURL('image/png');
    picPhoto.setAttribute('src', data);

    // Activate the crop page and croppie
    $("#cropBody").collapse('show');
    $(picCroppie).croppie('bind', { url: data });

    // Enable the submit button the crop page
    $(picSubmit).prop('disabled', false);

    // Reactivate the start button in case they want a new image
    $(camStart).prop('disabled', false);
}

function clearPhoto() {

    // Get the canvas and fill it with a grey rectangle
    var ctx = picCanvas.getContext('2d');
    ctx.fillStyle = "#444444";
    ctx.fillRect(0, 0, picCanvas.width, picCanvas.height);
    ctx.drawImage(camVideo, 0, 0, camWidth, camHeight);

    // Get a data url and put it into the img on the crop page
    var data = picCanvas.toDataURL('image/png');
    picPhoto.setAttribute('src', data);

    // Rebind croppie to keep it from displaying a bad page
    $(picCroppie).croppie('bind', { url: data });
}

function uploadImage(blob) {
    // Create a form data and attach the image
    var formData = new FormData();
    formData.append('image', blob);

    // Post it to the backend
    $.ajax({
        url: 'api/Ocr',
        type: 'POST',
        data: formData,
        cache: false,
        async: true,
        contentType: false,
        processData: false,
        dataType: 'json',
        error: function (err) {
            console.log(err);
        },
        success: function (data) {
            fillMatrix(data);
        },
        complete: function () {

        }
    })

    // Activate the matrix page for when the data comes back
    $("#matrixBody").collapse('show');
}

function fillMatrix(matrix) {
    var cells = matrix.cells;

    bulkPopulate = true;
    for (var row = 0; row < MAX_MATRIX_ROWS; row++) {
        for (var col = 0; col < MAX_MATRIX_COLS; col++) {
            var id = "matrix" + (row + 1) + LETTERS[col];
            var cell = document.getElementById(id);

            if (row >= cells.length || col >= cells[row].length) {
                $(cell).val("");
                $(cell).removeClass("cell-bad");
                continue;
            }

            var val = cells[row][col].value;
            $(cell).val(val);

            if (VALID_CELLS.indexOf(val) == -1) {
                $(cell).addClass("cell-bad");
            } else {
                $(cell).removeClass("cell-bad");
            }
        }
    }
    bulkPopulate = false;
}

function submitImage() {
    // Disable the submit button
    //$(picSubmit).prop('disabled', true);

    // Get the resulting image from croppie and call upload from the promise
    var file = $(picCroppie).croppie('result', { type: 'blob', size: 'original', format: 'png', circle: false }).then(uploadImage);
}

function handlePaste(event) {
    // Get the clipboard item
    var item = event.clipboardData.items[0];

    // If it's an image, read it
    if (item.type.indexOf("image") === 0) {
        var blob = item.getAsFile();

        var fileReader = new FileReader();
        fileReader.onload = pasteImage;

        fileReader.readAsDataURL(blob);
    }
}

function pasteImage(event) {
    var data = event.target.result;

    // Put the photo in the img element
    picPhoto.setAttribute('src', data);

    // Jump to the right page
    $("#cropBody").collapse('show');

    // Disable all the capture items
    $(camCapture).prop('disabled', true);
    
    // Enable croppie
    $(picCroppie).croppie('bind', { url: data });

    // Let the user click the submit button
    $(picSubmit).prop('disabled', false);
}

function submitMatrix() {
    var matrix = "";

    for (var row = 0; row < MAX_MATRIX_ROWS; row++) {
        var matrixRow = "";
        for (var col = 0; col < MAX_MATRIX_COLS; col++) {
            var id = "matrix" + (row + 1) + LETTERS[col];
            var cell = document.getElementById(id);
            var val = $(cell).val();
            matrixRow += val;
        }

        // Stop on the first empty row
        if (matrixRow.length == 0)
            break;

        matrix += matrixRow + ",";
    }

    matrix = matrix.slice(0, -1);

    var sequences = "";

    for (var row = 0; row < MAX_SEQUENCE_ROWS; row++) {
        var sequence = "";
        for (var col = 0; col < MAX_SEQUENCE_COLS; col++) {
            var id = "sequence" + (row + 1) + LETTERS[col];
            var cell = document.getElementById(id);
            var val = $(cell).val();
            sequence += val;
        }

        // Stop on the first empty sequence
        if (sequence.length == 0)
            break;

        var value = $(document.getElementById("sequence" + (row + 1) + "v")).val();
        if (value != null && value.length > 0)
            sequence += "=" + value;

        sequences += sequence + ",";
    }

    sequences = sequences.slice(0, -1);

    var memory = $(document.getElementById("sequenceMemory")).val();

    localStorage.setItem("defaultBufferSize", memory);

    var formData = new FormData();
    formData.append("matrixString", matrix);
    formData.append("sequenceString", sequences);
    formData.append("bufferSize", memory);

    // Post it to the backend
    $.ajax({
        url: 'api/Solve',
        type: 'POST',
        data: formData,
        cache: false,
        async: true,
        contentType: false,
        processData: false,
        dataType: 'json',
        error: function (err) {
            console.log(err);
        },
        success: function (data) {
            handleSolution(data);
        },
        complete: function () {

        }
    })


}

function handleSolution(sol) {
    var solution = "";
    for (var i = 0; i < sol.length; i++) {
        solution += sol[i] + "\n";
    }

    $(solBox).text(solution);
}

// Document handlers
$(document).ready(initCapture);
document.addEventListener('paste', handlePaste);
