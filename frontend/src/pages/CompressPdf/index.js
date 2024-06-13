import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  FormHelperText,
  Grid,
  Link,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
  Input,
  CircularProgress
} from '@mui/material';

import tus from 'tus-js-client';
import { validPDFExtensions, validPDFMimeTypes } from '../../utils/CommonFn';
import { PDFDocument } from 'pdf-lib';
import pdfToText from 'react-pdftotext';

const CompressPdf = () => {
  const [file, setFile] = useState([]);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadUrl, setUploadUrl] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const maxFileSize = 10485760; // 10 MB

  const searchForJavaScriptInPDF = (content) => {
    const jsPatterns = [
      /\/JS/,
      /\/JavaScript/,
      /\/S\s*\/JavaScript/,
      /<iframe[^>]*\sonload=["']([^"]+)["'][^>]*>/g,
      /document\.write\(/g,
      /document\.writeln\(/g,
      /document\.domain/g,
      /innerHTML/g,
      /outerHTML/g,
      /insertAdjacentHTML/g,
      /onevent/g,
      /addEventListener/g, // Alternative to onevent
      /appendChild/g,
      /insertBefore/g,
      /before/g,
      /after/g,
      /prepend/g,
      /append/g, // Alternative to appendChild
      /cloneNode/g,
      /createElement/g,
      /createTextNode/g,
      /normalize/g,
      /textContent/g,
      /innerText/g,
      /innerHTML/g,
      /outerHTML/g,
      /insertAdjacentHTML/g,
      /replaceWith/g,
      /wrap/g,
      /wrapInner/g,
      /wrapAll/g,
      /has/g,
      /constructor/g,
      /init/g,
      /index/g,
      /jQuery\.parseHTML/g,
      /\$\.parseHTML/g // jQuery alias
    ];

    for (const pattern of jsPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }
    return false;
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      const reader = new FileReader();

      reader.onloadstart = () => {
        setIsLoading(true);
      };


      reader.onload = async (e) => {  
        // setFileContent(e.target.result);
        setIsLoading(false);
        const hasJavaScript = searchForJavaScriptInPDF(e.target.result);
        if (hasJavaScript) {
          setError('The PDF contains JavaScript.');
        } else {
          // const text = await pdfToText(selectedFile);
          const text = reader.result;
          const hasJavaScript = searchForJavaScriptInPDF(text);
          if (hasJavaScript) {
            setError('The PDF contains JavaScript.');
          } else {
            setError('No JavaScript found in the PDF.');
            setFileContent(text);
          }
        }
      };

      reader.onloadend = () => {
        setIsLoading(false);
      };

      reader.onerror = (err) => {
        console.error('Error reading file:', err);
      };

      reader.readAsText(selectedFile);
    }

    // if (selectedFile.size > maxFileSize) {
    //   setError('File size should not exceed 10 MB');
    //   setFile(null);
    // } else if (selectedFile.type !== 'application/pdf') {
    //   setError('Only PDF files are allowed');
    //   setFile(null);
    // } else {

   
    setFileContent('');
    setError('');
    setFile(selectedFile);
    // }
  };

  const handleTusUpload = () => {
    setIsLoading(true);
    if (!file) {
      alert('Please select a valid file before uploading');
      return;
    }

    const upload = new tus.Upload(file, {
      // endpoint: 'https://api.edeekshaam.in/v1/files',
      endpoint: 'http://localhost:4400/tus/files',
      retryDelays: [0, 1000, 3000, 5000],
      metadata: {
        filename: file.name,
        filetype: file.type
      },
      onError: function (error) {
        if(error.message == "Invalid File"){
            setError(error.message);
            setIsLoading(false);
        }
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        setUploadProgress(percentage);
        console.log(bytesUploaded, bytesTotal, percentage + '%');
      },
      onSuccess: function () {
        setIsLoading(false);
        console.log('Download %s from %s', upload.file.name, upload.url);
        setUploadUrl(upload.url);
        console.log(upload, 'upload data');
        setUploadProgress(100);
        setError('');
      }
    });

    upload.start();
  };

  const handleSubmit = () => {
    // if (file.length === 0) {
    //   setError('Please select at least one file.');
    //   return;
    // }

    // const invalidFiles = file.filter((file) => {
    //   const fileExtension = file.name.split('.').pop().toLowerCase();
    //   const fileType = file.type;
    //   return !validPDFExtensions.includes(fileExtension) || !validPDFMimeTypes.includes(fileType);
    // });

    // if (invalidFiles.length > 0) {
    //   setError('One or more files are invalid. Please select only valid  files.');
    //   return;
    // }

    // Perform server-side validation
    const formData = new FormData();
    // file.forEach((file) => formData.append('files', file));
    formData.append('file', file)
    console.log(formData)
    setError('');
  };

  return (
    <>
      <form noValidate>
        <Grid container border={'1px solid black'} p={4} rowSpacing={2}>
          <Grid item md={12}>
            <input type={'file'} accept={'application/pdf'} onChange={handleFileChange} id="select-image" style={{ display: 'none' }} />
            <label htmlFor="select-image">
              <Button variant="contained" color="primary" component="span">
                Choose File
              </Button>
            </label>
            {file ? file.name : 'No File Chosen'}
          </Grid>
          <Grid item md={12}>
            <Button
            //   disabled={isLoading}
              variant="contained"
              color="primary"
              component="span"
              onClick={handleSubmit}
              startIcon={isLoading ? <CircularProgress style={{ color: 'white' }} size={14} /> : null}
            >
              submit
            </Button>
          </Grid>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {uploadProgress > 0 && <p>Upload Progress: {uploadProgress}%</p>}
          {uploadUrl && (
            <p>
              File uploaded successfully. Download URL: <a href={uploadUrl}>{uploadUrl}</a>
            </p>
          )}
        </Grid>
      </form>
      <Typography>{fileContent}</Typography>
    </>
  );
};

export default CompressPdf;
