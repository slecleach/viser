// Worker for processing plot data
self.onmessage = (e) => {
  const { x_data, y_data, history_length } = e.data;

  // Process data in worker thread
  const processedData = {
    x: x_data,
    y: y_data
  };

  // Send processed data back to main thread
  self.postMessage({ processedData });
};
