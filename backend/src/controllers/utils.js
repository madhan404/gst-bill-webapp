const numberToWords = (number) => {
  if (number === undefined || number === null || isNaN(Number(number))) {
    return 'Zero Rupees';
  }
  number = Number(number);
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertLessThanOneThousand = (n) => {
    if (n === 0) return '';
    
    if (n < 10) return ones[n];
    
    if (n < 20) return teens[n - 10];
    
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
  };

  const convert = (n) => {
    if (n === 0) return 'Zero';
    
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remaining = n % 1000;
    
    let words = '';
    
    if (crore > 0) {
      words += convertLessThanOneThousand(crore) + ' Crore ';
    }
    
    if (lakh > 0) {
      words += convertLessThanOneThousand(lakh) + ' Lakh ';
    }
    
    if (thousand > 0) {
      words += convertLessThanOneThousand(thousand) + ' Thousand ';
    }
    
    if (remaining > 0) {
      words += convertLessThanOneThousand(remaining);
    }
    
    return words.trim();
  };

  // Handle decimal numbers
  const parts = number.toString().split('.');
  const rupees = parseInt(parts[0]);
  const paise = parts.length > 1 ? parseInt(parts[1].padEnd(2, '0').slice(0, 2)) : 0;

  let result = convert(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convert(paise) + ' Paise';
  }

  return result;
};

module.exports = {
  numberToWords
}; 