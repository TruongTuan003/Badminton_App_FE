/**
 * Calculate BMI (Body Mass Index) based on height and weight
 * 
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {object} BMI value and category
 */
export const calculateBMI = (weight, height) => {
  // Weight is already in kg
  let weightInKg = weight;
  
  // Convert height from cm to meters
  let heightInMeters = height / 100;
  
  // Calculate BMI
  const bmi = weightInKg / (heightInMeters * heightInMeters);
  
  // Determine BMI category
  let category = '';
  if (bmi < 18.5) {
    category = 'Underweight';
  } else if (bmi >= 18.5 && bmi < 25) {
    category = 'Normal';
  } else if (bmi >= 25 && bmi < 30) {
    category = 'Overweight';
  } else {
    category = 'Obese';
  }
  
  return {
    value: parseFloat(bmi.toFixed(1)),
    category
  };
};
