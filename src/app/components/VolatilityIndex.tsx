import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from "@radix-ui/react-icons";

interface VolatilityData {
  current: number;
  pastFiveDays: number[];
}

const VolatilityCard: React.FC<{ data: VolatilityData }> = ({ data }) => {
  const getTrendIcon = () => {
    const trend = data.pastFiveDays[4] - data.pastFiveDays[0];
    if (trend > 0) return <ArrowUpIcon className="text-green-500" />;
    if (trend < 0) return <ArrowDownIcon className="text-red-500" />;
    return <ArrowRightIcon className="text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volatility Index</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{data.current.toFixed(2)}%</div>
        <div className="flex items-center mt-4">
          <span className="mr-2">5-Day Trend:</span>
          {getTrendIcon()}
        </div>
        <div className="flex justify-between mt-4">
          {data.pastFiveDays.map((value, index) => (
            <span key={index} className="text-sm">
              {value.toFixed(2)}%
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VolatilityCard;
