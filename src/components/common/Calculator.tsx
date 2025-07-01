import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useLoanCalculator } from "../../hooks/useLoanCalculator";
import { Plus } from "lucide-react";

interface CalculatorSectionProps {
  isDashboard?: boolean;
}

const CalculatorSection = ({ isDashboard = false }: CalculatorSectionProps) => {
  const [loanAmount, setLoanAmount] = useState(10000);
  const [loanTerm, setLoanTerm] = useState(12);
  const [ltv, setLtv] = useState(60);

  // Define available loan terms: 3, 6, 9, 12, 18, 24, 30, 36, 42, 48, 54, 60
  const lemonTermOptions = [
    3, 6, 9, 12, // 3-month increments up to 12
    18, 24, 30, 36, 42, 48, 54, 60 // 6-month increments from 18 to 60
  ];

  // Use the hook for all calculations - the hook now handles pricing internally
  const calculation = useLoanCalculator(loanAmount, loanTerm, ltv);

  const handleLoanTermChange = (sliderValue: number) => {
    const termIndex = Math.round(sliderValue);
    setLoanTerm(lemonTermOptions[termIndex]);
  };

  const getCurrentTermIndex = () => {
    return lemonTermOptions.indexOf(loanTerm);
  };

  const calculatorContent = (
    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
      <Card className={`${!isDashboard ? 'animate-slide-in-left bg-gradient-to-br from-gray-900 via-black to-gray-800 border-gray-700 text-white' : ''}`}>
        <CardHeader>
          <CardTitle className={`${!isDashboard ? 'text-2xl text-white' : ''}`}>Loan Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}>
              💰 How much do you need?
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-3 ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}>$</span>
              <Input
                type="number"
                value={loanAmount === 0 ? '' : loanAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Handle empty input
                  if (value === '') {
                    setLoanAmount(0);
                    return;
                  }
                  
                  const numValue = Number(value);
                  // Allow typing (don't enforce min while typing, only enforce max)
                  if (numValue <= 100000) {
                    setLoanAmount(numValue);
                  }
                }}
                onBlur={(e) => {
                  // Ensure we have a valid number when user leaves the field
                  const value = e.target.value;
                  if (value === '' || Number(value) < 1000) {
                    setLoanAmount(1000); // Set to minimum if empty or below min
                  }
                }}
                min="1000"
                max="100000"
                className={`pl-8 text-lg ${!isDashboard ? 'bg-white/10 border-white/20 text-white placeholder:text-gray-400' : ''}`}
                placeholder="10000"
              />
            </div>
            <div className={`text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>LUSD - $1,000 minimum loan with maximum amount of $100,000</div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}>
              📅 Loan Term: {loanTerm} months
            </label>
            <input
              type="range"
              min="0"
              max={lemonTermOptions.length - 1}
              step="1"
              value={getCurrentTermIndex()}
              onChange={(e) => handleLoanTermChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className={`flex justify-between text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>
              <span>3 months</span>
              <span>60 months</span>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${!isDashboard ? 'text-gray-300' : ''} mb-2`}>
              ⚖️ Loan-to-Value Ratio: {ltv}%
            </label>
            <input
              type="range"
              min="20"
              max="60"
              step="5"
              value={ltv}
              onChange={(e) => setLtv(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className={`flex justify-between text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>
              <span>20% (Safer)</span>
              <span>60% (Max)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`${!isDashboard ? 'animate-scale-in bg-gradient-to-br from-gray-900 via-black to-gray-800 border-gray-700 text-white' : ''}`}>
        <CardHeader>
          <CardTitle className={`${!isDashboard ? 'text-2xl text-white' : ''}`}>Loan Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`${!isDashboard ? 'bg-white/10 backdrop-blur-sm' : 'bg-muted'} rounded-lg p-4 border ${!isDashboard ? 'border-white/20' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-lg font-semibold ${!isDashboard ? 'text-gray-300' : ''}`}>Loan Amount</span>
              <span className={`text-2xl font-bold ${!isDashboard ? 'text-white' : ''}`}>${calculation.loanAmount.toLocaleString()} LUSD</span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}>
                  LEMON Required at ${calculation.lemonPrice > 0 ? `${calculation.lemonPrice.toFixed(2)}` : 'Price unavailable'}
                </span>
                <span className={`font-medium ${!isDashboard ? 'text-white' : ''}`}>
                  {calculation.lemonPrice > 0 
                    ? `${calculation.lemonRequired.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LEMON`
                    : calculation.priceError || 'Could not get price of LEMX'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}>Origination Fee - payable in LMLN</span>
                <span className={`font-medium ${!isDashboard ? 'text-white' : ''}`}>${calculation.originationFeeDollars.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}>LTV Ratio</span>
                <span className={`font-medium ${!isDashboard ? 'text-yellow-400' : 'text-yellow-600'}`}>{calculation.ltv}%</span>
              </div>
              <div className="flex justify-between">
                <span className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}>Estimated APR</span>
                <span className={`font-medium ${!isDashboard ? 'text-yellow-400' : 'text-yellow-600'}`}>{calculation.apr.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}>Monthly Payment</span>
                <span className={`font-medium ${!isDashboard ? 'text-white' : ''}`}>${calculation.monthlyPayment.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}>Balloon Payment</span>
                <span className={`font-medium ${!isDashboard ? 'text-white' : ''}`}>${calculation.balloonPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}>Loan Term</span>
                <span className={`font-medium ${!isDashboard ? 'text-white' : ''}`}>{calculation.loanTerm} months</span>
              </div>
            </div>
          </div>

          <div className={`text-center text-sm ${!isDashboard ? 'text-gray-400' : 'text-muted-foreground'}`}>
            ✓ No credit check required • ✓ Instant approval
          </div>
          
          {isDashboard && (
            <div className="text-center mt-6">
              <Button className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold py-3 px-8 text-lg">
                <Plus className="h-4 w-4 mr-2" />
                Create New Loan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isDashboard) {
    return calculatorContent;
  }

  return (
    <section id="calculator" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simulate Your Loan
          </h2>
          <p className="text-xl text-gray-600">Enter your loan parameters and then submit the form to get on the list</p>
        </div>

        {calculatorContent}

        {/* Centered Submit Button */}
        <div className="text-center mt-12">
          <Button className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-semibold py-3 px-8 text-lg">
            <a href="https://airtable.com/appt6TylkeAGQeAgR/pagMi66nT96i6I3a2/form">Submit For More Information</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CalculatorSection;