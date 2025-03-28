import React from 'react';
import { Divider } from 'semantic-ui-react';
import { FlexContainer } from '../shared/FlexContainer';
import Label from '../shared/Label';

const AnalyticsInfo = () => {
  return (
    <FlexContainer className="column" gap={16}>
      <Label fontSize={16}>Daily Income</Label>
      <Label>
        It is an estimate of the amount of KDX you will get at the end of the day as a reward for your KDX staking position. It comes from the 0.05%
        of the overall DEX trading fees.
      </Label>
      <Divider />
      <Label fontSize={16}>APR</Label>
      <Label>Annual Percentage Rate. It shows the estimated yearly interest generated by your tokens in the respective liquidity pool.</Label>
      <Divider />
      <Label fontSize={16}>Daily Volume</Label>
      <Label>Its value refers to the overall DEX Volume.</Label>
      <Divider />
      <Label fontSize={16}>KDX Burned</Label>
      <Label>
        It represents the total amount of KDX that has been burned through penalties on the position or rewards consequent to unstaking within the
        first 72h or withdrawing rewards within the initial 60-day window, respectively.
      </Label>
      <Divider />
      <Label fontSize={16}>Staked Share</Label>
      <Label>Your personal percentage share of KDX amongst all the KDX currently being staked.</Label>
      <Divider />
      <Label fontSize={16}>Total Staked</Label>
      <Label>It shows the percentage of KDX being staked with respect to the total KDX circulating supply.</Label>
    </FlexContainer>
  );
};

export default AnalyticsInfo;
