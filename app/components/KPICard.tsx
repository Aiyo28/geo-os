'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Target,
  MapPin,
  AlertTriangle,
  Leaf,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KPIData {
  eta: number;
  coverage: number;
  pickup_dist: number;
  anomalies_per_1k: number;
  co2_proxy: number;
}

interface KPICardProps {
  kpis: KPIData;
}

const KPICard: React.FC<KPICardProps> = ({ kpis }) => {
  if (!kpis) return null;

  const kpiItems = [
    {
      title: 'Average ETA',
      value: kpis.eta,
      unit: 'min',
      icon: Clock,
      color: 'text-geo-accent-blue',
      bgColor: 'bg-geo-accent-blue/10',
      borderColor: 'border-geo-accent-blue/20',
      description: 'Estimated time of arrival'
    },
    {
      title: 'Coverage',
      value: Math.round(kpis.coverage * 100),
      unit: '%',
      icon: Target,
      color: 'text-geo-success',
      bgColor: 'bg-geo-success/10',
      borderColor: 'border-geo-success/20',
      description: 'Service area coverage'
    },
    {
      title: 'Pickup Distance',
      value: kpis.pickup_dist,
      unit: 'km',
      icon: MapPin,
      color: 'text-geo-accent-orange',
      bgColor: 'bg-geo-accent-orange/10',
      borderColor: 'border-geo-accent-orange/20',
      description: 'Average pickup distance'
    },
    {
      title: 'Anomalies',
      value: kpis.anomalies_per_1k,
      unit: '/1k trips',
      icon: AlertTriangle,
      color: 'text-geo-error',
      bgColor: 'bg-geo-error/10',
      borderColor: 'border-geo-error/20',
      description: 'Route anomalies detected'
    },
    {
      title: 'CO₂ Efficiency',
      value: kpis.co2_proxy,
      unit: 'score',
      icon: Leaf,
      color: 'text-geo-success',
      bgColor: 'bg-geo-success/10',
      borderColor: 'border-geo-success/20',
      description: 'Environmental impact score'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const formatValue = (value: number): string => {
    if (typeof value !== 'number') return String(value);

    if (value < 1) return value.toFixed(2);
    if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
    return Math.round(value).toString();
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="my-8"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-geo-accent-blue to-geo-success geo-glow-blue" />
          <h2 className="text-xl font-semibold text-geo-text-light">
            Analytics Dashboard
          </h2>
        </div>
        <p className="text-sm text-geo-text-muted">
          Real-time performance metrics and insights
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {kpiItems.map((item, index) => {
          const IconComponent = item.icon;

          return (
            <motion.div key={item.title} variants={itemVariants}>
              <Card className={`relative overflow-hidden border-t-2 ${item.borderColor} group hover:shadow-lg transition-all duration-300`}>
                <CardContent className="p-6">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${item.bgColor}`} />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${item.bgColor}`}>
                        <IconComponent className={`h-5 w-5 ${item.color}`} />
                      </div>

                      {/* Trend indicator - placeholder for future enhancement */}
                      <motion.div
                        className="opacity-0 group-hover:opacity-100"
                        transition={{ delay: 0.1 }}
                      >
                        {index % 2 === 0 ? (
                          <TrendingUp className="h-4 w-4 text-geo-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-geo-error" />
                        )}
                      </motion.div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xs font-medium text-geo-text-muted uppercase tracking-wider mb-2">
                      {item.title}
                    </h3>

                    {/* Value */}
                    <div className="flex items-baseline gap-1 mb-2">
                      <motion.span
                        className="text-2xl font-bold text-geo-text-light"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                      >
                        {formatValue(item.value)}
                      </motion.span>
                      {item.unit && (
                        <span className="text-sm text-geo-text-muted font-medium">
                          {item.unit}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-geo-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.description}
                    </p>

                    {/* Progress bar simulation */}
                    <div className="mt-4 h-1 bg-geo-progress-bg rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.color.replace('text-', 'bg-')}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (item.value / (item.title === 'Coverage' ? 100 : 50)) * 100)}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default KPICard;