import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@repo/design-system/components/ui/radio-group';
import { Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { BrokerSplit } from '../types';
import { validateBrokerSplits } from '../utils/validation';

interface JointCaseStepProps {
  isJointCase: boolean | null;
  brokerSplits: BrokerSplit[];
  onIsJointCaseChange: (value: boolean) => void;
  onBrokerSplitsChange: (splits: BrokerSplit[]) => void;
}

export default function JointCaseStep({
  isJointCase,
  brokerSplits,
  onIsJointCaseChange,
  onBrokerSplitsChange,
}: JointCaseStepProps) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const brokerDetailsRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);
  
  // Initialize nextIdRef based on existing brokers
  useEffect(() => {
    if (brokerSplits.length > 0) {
      const maxId = Math.max(...brokerSplits.map(b => parseInt(b.id) || 0));
      nextIdRef.current = maxId + 1;
    }
  }, []);

  const brokerSplitsError = isJointCase
    ? validateBrokerSplits(brokerSplits)
    : null;
  const totalPercentage = brokerSplits.reduce(
    (sum, split) => sum + split.splitPercentage,
    0
  );

  const addBroker = () => {
    const newBroker: BrokerSplit = {
      id: `broker-${Date.now()}-${nextIdRef.current}`,
      name: '',
      splitPercentage: 0,
    };
    onBrokerSplitsChange([...brokerSplits, newBroker]);
    nextIdRef.current += 1;
  };

  const removeBroker = (id: string) => {
    onBrokerSplitsChange(brokerSplits.filter((broker) => broker.id !== id));
  };

  const updateBroker = (
    id: string,
    field: 'name' | 'splitPercentage',
    value: string | number
  ) => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    onBrokerSplitsChange(
      brokerSplits.map((broker) =>
        broker.id === id ? { ...broker, [field]: value } : broker
      )
    );
  };

  const handleJointCaseChange = (value: string) => {
    const isJoint = value === 'yes';
    onIsJointCaseChange(isJoint);

    if (isJoint && brokerSplits.length === 0) {
      // Add first broker when switching to joint case
      addBroker();
    } else if (!isJoint) {
      // Clear brokers when switching to non-joint case
      onBrokerSplitsChange([]);
    }
  };

  // Scroll to broker details when isJointCase becomes true
  useEffect(() => {
    if (isJointCase === true && brokerDetailsRef.current) {
      setTimeout(() => {
        brokerDetailsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start'
        });
      }, 100);
    }
  }, [isJointCase]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Joint Case</h2>
        <p className="text-gray-600 mt-2">
          Is the fee split between multiple brokers?
        </p>
      </div>

      <RadioGroup
        value={isJointCase === null ? '' : isJointCase ? 'yes' : 'no'}
        onValueChange={handleJointCaseChange}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Label htmlFor="joint-yes" className="cursor-pointer">
          <Card
            className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 h-32 ${
              isJointCase === true
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="flex items-center space-x-4">
                <RadioGroupItem
                  value="yes"
                  id="joint-yes"
                  className="sr-only"
                />
                <div className="flex-shrink-0">
                  <UserCheck
                    className={`h-8 w-8 ${
                      isJointCase === true ? 'text-orange-600' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-gray-900">Yes</div>
                  <p className="text-sm text-gray-600 mt-1 leading-tight">
                    Fee is split betweeni brokers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Label>

        <Label htmlFor="joint-no" className="cursor-pointer">
          <Card
            className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 h-32 ${
              isJointCase === false
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div className="flex items-center space-x-4">
                <RadioGroupItem value="no" id="joint-no" className="sr-only" />
                <div className="flex-shrink-0">
                  <UserX
                    className={`h-8 w-8 ${
                      isJointCase === false ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-gray-900">No</div>
                  <p className="text-sm text-gray-600 mt-1 leading-tight">
                    Single broker case
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Label>
      </RadioGroup>

      {isJointCase && (
        <Card ref={brokerDetailsRef}>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Broker Split Details</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBroker}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Broker</span>
                </Button>
              </div>

              {brokerSplits.length > 0 && (
                <div className="space-y-4">
                  {brokerSplits.map((broker, index) => (
                    <div
                      key={broker.id}
                      className="space-y-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Broker {index + 1}
                        </h4>
                        {brokerSplits.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeBroker(broker.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label
                            htmlFor={`broker-name-${broker.id}`}
                            className="text-sm font-medium"
                          >
                            Broker Name
                          </Label>
                          <Input
                            id={`broker-name-${broker.id}`}
                            type="text"
                            value={broker.name}
                            onChange={(e) =>
                              updateBroker(broker.id, 'name', e.target.value)
                            }
                            placeholder="Enter broker name"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor={`broker-split-${broker.id}`}
                            className="text-sm font-medium"
                          >
                            Split Percentage
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              id={`broker-split-${broker.id}`}
                              type="number"
                              min="0.01"
                              max="100"
                              step="0.01"
                              value={broker.splitPercentage || ''}
                              onChange={(e) => {
                                const value =
                                  Number.parseFloat(e.target.value) || 0;
                                updateBroker(
                                  broker.id,
                                  'splitPercentage',
                                  value
                                );
                              }}
                              placeholder="0.00"
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Total Percentage:</span>
                      <span
                        className={`font-bold ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {totalPercentage.toFixed(2)}%
                      </span>
                    </div>
                    {hasInteracted && Math.abs(totalPercentage - 100) >= 0.01 && (
                      <p className="text-sm text-red-600 mt-1">
                        Total must equal 100%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {hasInteracted && brokerSplitsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{brokerSplitsError}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
