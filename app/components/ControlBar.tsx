'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Zap,
  Play,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ControlBarProps {
  onSimulate: () => void;
  forecastHorizon: string;
  setForecastHorizon: (horizon: string) => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  onSimulate,
  forecastHorizon,
  setForecastHorizon,
}) => {
  const horizonOptions = [
    { value: '15m', label: '15 Minutes', icon: Zap, description: 'Short-term forecast' },
    { value: '1h', label: '1 Hour', icon: Clock, description: 'Medium-term forecast' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="my-6"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-geo-accent-orange" />
            Forecast Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {/* Forecast Horizon */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="flex items-center gap-2 text-sm font-medium text-geo-text-muted uppercase tracking-wider">
                <Zap className="h-4 w-4" />
                Forecast Horizon
              </label>
              <Select value={forecastHorizon} onValueChange={setForecastHorizon}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select horizon" />
                </SelectTrigger>
                <SelectContent>
                  {horizonOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-geo-text-muted">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </motion.div>
          </div>

          {/* Simulation Button */}
          <motion.div
            className="flex justify-center pt-4 border-t border-geo-border"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={onSimulate}
              className="bg-gradient-to-r from-geo-accent-orange to-orange-400 hover:shadow-lg hover:shadow-geo-accent-orange/25 geo-glow-orange"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Simulation
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ControlBar;